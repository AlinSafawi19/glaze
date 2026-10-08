import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/ui/footer";
import { Header } from "@/components/ui/header";
import { CartDrawer } from "@/components/ui/cart-drawer";
import { PageLoader } from "@/components/ui/page-loader";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter-loaded",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:  `${SITE_NAME} — Korean skincare, curated`,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type:        "website",
    siteName:    SITE_NAME,
    locale:      "en_US",
    title:       `${SITE_NAME} — Korean skincare, curated`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // `globals.css` sets `scroll-behavior: smooth` for in-page anchors. Since
    // Next 16 that also applies to route changes, which leaves a new page
    // gliding down from wherever the last one was scrolled to. This attribute
    // opts back into Next's override: it drops to `auto` for the navigation, so
    // every page opens at the top, then restores smooth scrolling.
    <html lang="en" className={inter.variable} data-scroll-behavior="smooth">
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=clash-display@200,300,400,500,600,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <svg
          aria-hidden
          style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
        >
          <defs>
            <symbol id="465907804" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </symbol>
          </defs>
        </svg>
        {/* Above everything, including the cart drawer at z-300. */}
        <PageLoader />
        <Header />
        <CartDrawer />
        {children}
        <Footer />
      </body>
    </html>
  );
}
