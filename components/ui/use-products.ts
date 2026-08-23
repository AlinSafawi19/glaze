"use client";

import { useEffect, useState } from "react";

import { parseStock } from "@/lib/stock";

const PRODUCTS_URL = `${process.env.NEXT_PUBLIC_DASHBOARD_BACKEND_URL}/glaze/products?limit=100`;
const API_HEADERS  = { Authorization: `Bearer ${process.env.NEXT_PUBLIC_DASHBOARD_API_KEY}` };

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
    fetch(PRODUCTS_URL, { headers: API_HEADERS })
      .then((r) => r.json())
      .then((data) => {
        const entries: RawEntry[] = data?.data ?? [];
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
      .finally(() => setLoading(false));
  }, []);

  return { products, loading };
}
