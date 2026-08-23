/**
 * Relation fields come off the dashboard API in whatever shape the entry ended
 * up with: an object expanded to `{ id, Slug, Title }`, a bare slug string, a
 * list of either, or a single comma-separated string. Everything here
 * normalises down to slugs, which is what the storefront filters on.
 */
export type Relation = string | { Slug?: string } | null | undefined;

/** Single-valued fields: Brand, Collections. */
export function relationSlug(value: Relation): string {
  if (!value) return "";
  return (typeof value === "string" ? value : value.Slug ?? "").trim();
}

/**
 * Multi-valued fields: Category and Skin Type. A product can sit in Cleansers
 * *and* Toners, so both arrive as a list — of expanded objects from the
 * dashboard API, or as one comma-separated string if the field ever comes
 * through unexpanded.
 */
export function relationSlugs(value: Relation | Relation[]): string[] {
  if (Array.isArray(value)) return value.flatMap((v) => relationSlugs(v));
  if (typeof value === "string") {
    return value.split(",").map((s) => s.trim()).filter(Boolean);
  }
  const slug = relationSlug(value);
  return slug ? [slug] : [];
}

/**
 * Category and Skin Type keep their singular key on the wire even though both
 * hold a list; the plural spellings are accepted too, so a rename on the
 * dashboard side does not blank the filters here.
 */
export interface RawRelations {
  Category?:     Relation | Relation[];
  Categories?:   Relation | Relation[];
  "Skin Type"?:  Relation | Relation[];
  "Skin Types"?: Relation | Relation[];
}

export function categorySlugs(entry: RawRelations): string[] {
  return relationSlugs(entry.Categories ?? entry.Category);
}

export function skinTypeSlugs(entry: RawRelations): string[] {
  return relationSlugs(entry["Skin Types"] ?? entry["Skin Type"]);
}
