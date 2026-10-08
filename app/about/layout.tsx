import type { Metadata } from "next";

export const metadata: Metadata = {
  title:       "About",
  description: "GLAZE is a retailer of authentic Korean skincare, sourced direct from the brands and their authorised distributors — never reformulated or repackaged.",
  alternates:  { canonical: "/about" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
