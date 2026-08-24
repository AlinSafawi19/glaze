"use client";

import { useEffect, useState } from "react";

import { fetchAll, endpoint } from "@/lib/api";

const BRANDS_URL = endpoint("brands");

export interface Brand {
  id:   string;
  name: string;
  slug: string;
}

interface RawBrand {
  id:    string;
  Title: string;
  Slug:  string;
}

/**
 * The header mounts once per session, but the drawer and the desktop nav both
 * want the list — share a single in-flight request between every caller.
 */
let cache: Promise<Brand[]> | null = null;

function load(): Promise<Brand[]> {
  if (!cache) {
    // Every page — the endpoint hands back 20 rows unasked, which would have
    // cut the A–Z index off at whatever brand happened to be twentieth.
    cache = fetchAll<RawBrand>(BRANDS_URL)
      .then((rows) =>
        rows
          .map((e) => ({
            id:   e.id,
            name: e.Title,
            slug: e.Slug,
          }))
          // The menu is an A–Z list, so it is sorted here rather than trusting
          // the order the dashboard happened to return.
          .sort((a: Brand, b: Brand) => a.name.localeCompare(b.name))
      )
      .catch(() => {
        cache = null; // let the next mount try again
        return [];
      });
  }
  return cache;
}

export interface BrandsState {
  brands:  Brand[];
  /** False once the request settles — an empty list then means empty, not pending. */
  loading: boolean;
}

export function useBrands(): BrandsState {
  const [state, setState] = useState<BrandsState>({ brands: [], loading: true });

  useEffect(() => {
    let alive = true;
    load().then((list) => { if (alive) setState({ brands: list, loading: false }); });
    return () => { alive = false; };
  }, []);

  return state;
}
