"use client";

import { useEffect, useState } from "react";

import { fetchAll, endpoint } from "@/lib/api";
import { parseStock } from "@/lib/stock";

const PRODUCTS_URL = endpoint("products");

interface RawEntry {
  id:            string;
  Slug:          string;
  Title:         string;
  "Cover img 1": string;
  Price:         string;
  Discount:      string;
  /** Absent for a product the shop does not count — see `lib/stock`. */
  Stock?:        string;
}

export interface CatalogProduct {
  id:         string;
  slug:       string;
  title:      string;
  price:      number;
  discount:   number;
  finalPrice: number;
  imageSrc:   string;
  /** Units left, or null when the shop does not track this product. */
  stock:      number | null;
}

/** Whole catalogue, used by the cart and checkout to resolve stored slugs. */
export function useProducts() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const abort = new AbortController();

    // Every page: the cart and the wishlist resolve stored slugs against this,
    // and a slug that fell past the first page would read as a vanished
    // product rather than one further down the catalogue.
    fetchAll<RawEntry>(PRODUCTS_URL, { signal: abort.signal })
      .then((entries) => {
        if (abort.signal.aborted) return;
        setProducts(
          entries.map((e) => {
            const price    = parseFloat(e.Price)    || 0;
            const discount = parseFloat(e.Discount) || 0;
            return {
              id:         e.id,
              slug:       e.Slug,
              title:      e.Title,
              price,
              discount,
              // Discount is a percentage off, matching the product page.
              finalPrice: discount > 0 ? Math.round(price * (1 - discount / 100)) : price,
              imageSrc:   e["Cover img 1"],
              stock:      parseStock(e.Stock),
            };
          })
        );
      })
      .catch(() => setProducts([]))
      .finally(() => { if (!abort.signal.aborted) setLoading(false); });

    return () => abort.abort();
  }, []);

  return { products, loading };
}
