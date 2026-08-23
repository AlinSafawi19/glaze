/**
 * Stock, as the storefront reads it off the dashboard API.
 *
 * The API sends `Stock` only for products the shop actually counts, so an
 * absent field is a real answer — "not tracked", always available — rather than
 * a parse failure. That is what `null` means everywhere below, and it is why
 * nothing here treats a missing count as zero.
 */

/** The cart's own ceiling, applied to products with no count of their own. */
export const CART_MAX = 999;

export function parseStock(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const units = Number.parseInt(String(value), 10);
  return Number.isFinite(units) ? Math.max(0, units) : null;
}

export function isSoldOut(stock: number | null): boolean {
  return stock !== null && stock <= 0;
}

/** The most of this a shopper may hold. */
export function maxOrderable(stock: number | null): number {
  return stock === null ? CART_MAX : Math.max(0, stock);
}

/**
 * "Only 2 left" — worth saying when the number is small enough to hurry a
 * decision, and noise otherwise.
 */
export const LOW_STOCK_AT = 3;

export function lowStockNote(stock: number | null): string | null {
  if (stock === null || stock <= 0 || stock > LOW_STOCK_AT) return null;
  return stock === 1 ? "Only 1 left" : `Only ${stock} left`;
}
