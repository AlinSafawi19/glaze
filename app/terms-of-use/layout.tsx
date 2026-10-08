import type { Metadata } from "next";

export const metadata: Metadata = {
  title:       "Terms of use",
  description: "The terms that apply when you browse and order from GLAZE, including payment, delivery and returns.",
  alternates:  { canonical: "/terms-of-use" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
