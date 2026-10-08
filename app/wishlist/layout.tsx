import type { Metadata } from "next";

/** Per-shopper pages: nothing here is worth a search result. */
export const metadata: Metadata = {
  title:  "Wishlist",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
