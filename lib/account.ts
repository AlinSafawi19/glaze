import "server-only";

import { cookies } from "next/headers";

/**
 * The storefront's half of the customer account system.
 *
 * The browser never sees a session token: it lives in an httpOnly cookie on
 * this origin, and these helpers replay it to the backend from the server.
 * That also keeps the API key server-side for anything account-shaped, and
 * sidesteps cross-origin cookie rules entirely.
 */

export const ACCOUNT_COOKIE = "glaze_customer";

const BASE = process.env.NEXT_PUBLIC_DASHBOARD_BACKEND_URL;
const API_KEY = process.env.NEXT_PUBLIC_DASHBOARD_API_KEY;

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
}

export interface OrderItem {
  id: string;
  Slug: string;
  Title: string;
  Image: string;
  UnitPrice: string;
  Qty: number;
}

export interface CustomerOrder {
  id: string;
  Reference: string;
  Status: string;
  Total: string;
  Placed: string;
  Payment: string;
  Name: string;
  Phone: string;
  Address: string;
  City: string;
  Notes: string;
  Items: OrderItem[];
}

function headers(token?: string | null): HeadersInit {
  const base: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${API_KEY}`,
  };
  if (token) base["X-Customer-Token"] = token;
  return base;
}

export async function readToken(): Promise<string | null> {
  return (await cookies()).get(ACCOUNT_COOKIE)?.value ?? null;
}

export async function setToken(token: string, expiresAt: string): Promise<void> {
  const store = await cookies();
  store.set(ACCOUNT_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(expiresAt),
    path: "/",
  });
}

export async function clearToken(): Promise<void> {
  (await cookies()).delete(ACCOUNT_COOKIE);
}

/** POST to an account endpoint. Returns the parsed body plus the status. */
export async function accountPost(
  action: string,
  body: unknown,
  token?: string | null
): Promise<{ status: number; data: Record<string, unknown> }> {
  const res = await fetch(`${BASE}/glaze/account/${action}`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify(body ?? {}),
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

/**
 * The signed-in customer, or null. Used by server components — a failure here
 * reads as "signed out" rather than breaking the page.
 */
export async function currentCustomer(): Promise<Customer | null> {
  const token = await readToken();
  if (!token) return null;

  try {
    const res = await fetch(`${BASE}/glaze/account/me`, {
      headers: headers(token),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data?.customer as Customer) ?? null;
  } catch {
    return null;
  }
}

export async function customerOrders(): Promise<{
  customer: Customer | null;
  orders: CustomerOrder[];
}> {
  const token = await readToken();
  if (!token) return { customer: null, orders: [] };

  try {
    const res = await fetch(`${BASE}/glaze/account/orders`, {
      headers: headers(token),
      cache: "no-store",
    });
    if (!res.ok) return { customer: null, orders: [] };
    const data = await res.json();
    return {
      customer: (data?.customer as Customer) ?? null,
      orders: (data?.orders as CustomerOrder[]) ?? [],
    };
  } catch {
    return { customer: null, orders: [] };
  }
}
