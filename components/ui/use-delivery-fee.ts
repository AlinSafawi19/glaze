"use client";

import { useEffect, useState } from "react";
import { endpoint } from "@/lib/api";

/**
 * The flat delivery fee, as the dashboard charges it.
 *
 * It lives in the dashboard's Settings, so the cart shows the figure checkout
 * will charge rather than a copy that can drift. One request per visit, shared
 * by the drawer, the cart and checkout.
 */
let feeRequest: Promise<number | null> | null = null;

function loadDeliveryFee(): Promise<number | null> {
  if (!feeRequest) {
    feeRequest = fetch(endpoint("settings"), {
      headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_DASHBOARD_API_KEY}` },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((body) => {
        const fee = Number(body?.data?.DeliveryFee);
        return Number.isFinite(fee) && fee >= 0 ? fee : null;
      })
      .catch(() => {
        feeRequest = null; // let the next mount try again
        return null;
      });
  }
  return feeRequest;
}

/** The fee in dollars, or null until it is known (or if it cannot be read). */
export function useDeliveryFee(): number | null {
  const [fee, setFee] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    loadDeliveryFee().then((value) => { if (alive) setFee(value); });
    return () => { alive = false; };
  }, []);

  return fee;
}
