import type { Metadata } from "next";

export const metadata: Metadata = {
  title:       "Contact & FAQ",
  description: "Questions about an order, delivery or a product? Reach GLAZE by email or phone, and find answers on cash on delivery, shipping times and authenticity.",
  alternates:  { canonical: "/contact" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
