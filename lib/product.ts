import { categorySlugs, relationSlug, type Relation, type RawRelations } from "@/lib/relations";
import { parseStock } from "@/lib/stock";

/**
 * A product as the product page reads it. Shared by the server half of the
 * page, which fetches it, and the client half, which renders it — so it stays
 * plain data that can cross that boundary.
 */
export interface Product {
  id:              string;
  slug:            string;
  title:           string;
  price:           number;
  discount:        number;
  cover_img_1:     string;
  img_2:           string;
  img_3:           string;
  img_4:           string;
  /** A product can be filed under several headings at once. */
  categories:      string[];
  brand:           string;
  size:            string;
  stock:           number | null;
  description:     string;
  best_for:        string;
  benefits:        string;
  how_to_use:      string;
  key_ingredients: string;
  sales_type:      string;
  collections:     string;
}

export interface RawProduct extends RawRelations {
  id:              string;
  Slug:            string;
  Title:           string;
  Price:           string;
  Discount:        string;
  "Cover img 1":   string;
  "Img 2":         string;
  "Img 3":         string;
  "Img 4":         string;
  Brand:           Relation;
  Size:            string;
  Stock?:          string;
  Description:     string;
  "Best For":      string;
  Benefits:        string;
  "How to Use":    string;
  "Key Ingredients": string;
  "Sales type":    string;
  Collections:     Relation;
}

export function toProduct(e: RawProduct): Product {
  return {
    id:              e.id,
    slug:            e.Slug                ?? "",
    title:           e.Title               ?? "",
    price:           parseFloat(e.Price)        || 0,
    discount:        parseFloat(e.Discount)     || 0,
    cover_img_1:     e["Cover img 1"]      ?? "",
    img_2:           e["Img 2"]             ?? "",
    img_3:           e["Img 3"]             ?? "",
    img_4:           e["Img 4"]             ?? "",
    categories:      categorySlugs(e),
    brand:           relationSlug(e.Brand),
    size:            e.Size                 ?? "",
    stock:           parseStock(e.Stock),
    description:     e.Description          ?? "",
    best_for:        e["Best For"]          ?? "",
    benefits:        e.Benefits             ?? "",
    how_to_use:      e["How to Use"]        ?? "",
    key_ingredients: e["Key Ingredients"]   ?? "",
    sales_type:      e["Sales type"]        ?? "",
    collections:     relationSlug(e.Collections),
  };
}

/** `some-brand` → `Some Brand`, for slugs that have to be read as names. */
export function slugLabel(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** What the shopper pays, discount applied, rounded the way the page shows it. */
export function salePrice(product: Pick<Product, "price" | "discount">): number {
  return product.discount > 0
    ? Math.round(product.price * (1 - product.discount / 100))
    : product.price;
}

export function productImages(product: Product): string[] {
  return [product.cover_img_1, product.img_2, product.img_3, product.img_4].filter(Boolean);
}
