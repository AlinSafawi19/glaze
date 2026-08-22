"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { accountPost, clearToken, readToken, setToken } from "@/lib/account";

export interface AccountState {
  error?: string;
  ok?: boolean;
}

function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

/** Only ever send the shopper back inside the site. */
function safeNext(value: string): string {
  return value.startsWith("/") && !value.startsWith("//") ? value : "/account";
}

/** The code screen, carrying the address it is for and where to go after. */
function verifyPath(email: string, next: string): string {
  const params = new URLSearchParams({ email });
  if (next) params.set("next", safeNext(next));
  return `/account/verify?${params}`;
}

/**
 * Signing up no longer signs anyone in: the backend creates the account
 * unverified and emails a six-digit code. The session is issued by `verify`,
 * so this hands the shopper to the code screen rather than setting a cookie.
 */
export async function signUp(
  _state: AccountState,
  formData: FormData
): Promise<AccountState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");
  if (password !== confirm) return { error: "The two passwords do not match." };

  const email = field(formData, "email");

  const { status, data } = await accountPost("register", {
    name: field(formData, "name"),
    email,
    password,
    phone: field(formData, "phone"),
    address: field(formData, "address"),
    city: field(formData, "city"),
  });

  if (status !== 201) {
    return { error: String(data.error ?? "We could not create your account.") };
  }

  redirect(verifyPath(email, field(formData, "next")));
}

/**
 * The code came back. This is the call that returns a token, so confirming the
 * address is also what signs the shopper in — they land on `next` already
 * authenticated, with no second trip through the sign-in form.
 */
export async function verifyEmail(
  _state: AccountState,
  formData: FormData
): Promise<AccountState> {
  const { status, data } = await accountPost("verify", {
    email: field(formData, "email"),
    code: field(formData, "code"),
  });

  if (status !== 200) {
    return { error: String(data.error ?? "We could not confirm your email address.") };
  }

  await setToken(String(data.token), String(data.expiresAt));
  redirect(safeNext(field(formData, "next")));
}

/** Another code, for whoever lost the first one. */
export async function resendCode(
  _state: AccountState,
  formData: FormData
): Promise<AccountState> {
  const { status, data } = await accountPost("resend-code", {
    email: field(formData, "email"),
  });

  if (status !== 202) {
    return { error: String(data.error ?? "We could not send another code.") };
  }
  return { ok: true };
}

export async function signIn(
  _state: AccountState,
  formData: FormData
): Promise<AccountState> {
  const email = field(formData, "email");

  const { status, data } = await accountPost("login", {
    email,
    password: String(formData.get("password") ?? ""),
  });

  if (status !== 200) {
    // Right password, unproven address. The backend has already sent a fresh
    // code, so this belongs on the code screen — not shown as a failed sign-in.
    if (data.verificationRequired) {
      redirect(verifyPath(email, field(formData, "next")));
    }
    return { error: String(data.error ?? "We could not sign you in.") };
  }

  await setToken(String(data.token), String(data.expiresAt));
  redirect(safeNext(field(formData, "next")));
}

export async function signOut(): Promise<void> {
  const token = await readToken();
  // Revoke server-side first so the session dies even if the cookie lingers.
  await accountPost("logout", {}, token).catch(() => undefined);
  await clearToken();
  redirect("/");
}

export async function saveProfile(
  _state: AccountState,
  formData: FormData
): Promise<AccountState> {
  const token = await readToken();
  if (!token) return { error: "You are signed out. Sign in and try again." };

  const { status, data } = await accountPost(
    "profile",
    {
      name: field(formData, "name"),
      phone: field(formData, "phone"),
      address: field(formData, "address"),
      city: field(formData, "city"),
    },
    token
  );

  if (status !== 200) {
    return { error: String(data.error ?? "We could not save your details.") };
  }

  revalidatePath("/account");
  return { ok: true };
}

export interface CheckoutState {
  error?: string;
  orderNumber?: number;
}

/**
 * Placing an order runs through the server so the signed-in customer can be
 * attached from the httpOnly cookie, and so the API key never reaches the
 * browser. Guests take the same path with no token.
 */
export async function placeOrder(
  lines: Array<{ slug: string; qty: number }>,
  details: {
    name: string;
    /** Guests only — a signed-in shopper's account address is used instead. */
    email: string;
    phone: string;
    address: string;
    city: string;
    notes: string;
  }
): Promise<CheckoutState> {
  if (lines.length === 0) return { error: "Your cart is empty." };

  const token = await readToken();

  const res = await fetch(`${process.env.NEXT_PUBLIC_DASHBOARD_BACKEND_URL}/glaze/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_DASHBOARD_API_KEY}`,
      ...(token ? { "X-Customer-Token": token } : {}),
    },
    cache: "no-store",
    body: JSON.stringify({
      Name: details.name,
      // Omitted rather than sent empty: the backend rejects "" as a malformed
      // address, and falls back to the account's own when the field is absent.
      ...(details.email.trim() ? { Email: details.email.trim() } : {}),
      Phone: details.phone,
      Address: details.address,
      City: details.city,
      Notes: details.notes,
      Payment: "Cash on delivery",
      Items: lines.map((line) => ({ Slug: line.slug, Qty: line.qty })),
    }),
  }).catch(() => null);

  if (!res) return { error: "We could not reach the store. Please try again." };

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { error: String(data.error ?? "We could not place the order.") };
  }

  revalidatePath("/account/orders");
  return { orderNumber: Number(data?.data?.Number) || undefined };
}
