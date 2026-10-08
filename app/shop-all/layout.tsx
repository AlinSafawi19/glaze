import type { Metadata } from "next";

export const metadata: Metadata = {
  title:       "Shop all Korean skincare",
  description: "Browse the full GLAZE catalogue of authentic Korean skincare — filter by brand, category, skin type and collection.",
  alternates:  { canonical: "/shop-all" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
