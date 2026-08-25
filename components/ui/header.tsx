"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingBag, ChevronDown, User } from "lucide-react";
import { ButtonSm, BodySm } from "./typography";
import { Logomark } from "./logomark";
import { useWishlist } from "./use-wishlist";
import { useCart } from "./use-cart";
import { PagedListControls } from "./paged-list";
import { useFilterOptions, type PagedList } from "./use-shop-data";
import type { FilterItem } from "./filters";
import { useScrollLock } from "./use-scroll-lock";

const EASE   = [0.44, 0, 0.56, 1] as const;
// Long, low-bounce ease so the panel glides rather than snaps.
const PANEL  = { duration: 0.45, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] };

const NAV: { title: string; href: string; submenu?: boolean }[] = [
  { title: "Home",     href: "/"         },
  { title: "Brands",   href: "/shop-all", submenu: true },
  { title: "About",    href: "/about"    },
  { title: "Contact",  href: "/contact"  },
];

/** `#shop` drops the shopper past the hero, onto the freshly filtered grid. */
/** Brands listed in a menu before "Show more" — a shop can have a great many. */
const BRAND_MENU_PAGE_SIZE = 10;

const brandHref = (slug?: string) =>
  slug ? `/shop-all?brand=${slug}#shop` : "/shop-all#shop";

/**
 * Nav link built on the same sweep-fill interaction as OutlineButton: a solid
 * block slides in behind the label and the type flips to accent. The current
 * page holds that state permanently.
 */
function NavLink({ title, href, active }: { title: string; href: string; active: boolean }) {
  const [hovered, setHovered] = useState(false);
  const on = active || hovered;

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex flex-row items-center justify-center px-[12px] py-[6px] rounded-none overflow-clip"
    >
      <span
        aria-hidden
        className={`absolute inset-0 bg-plum rounded-none transition-opacity duration-300 ease-[cubic-bezier(0.44,0,0.56,1)] ${
          on ? "opacity-100" : "opacity-0"
        }`}
      />
      <ButtonSm
        className="relative z-10 text-left"
        style={{
          color: on ? "var(--color-lavender)" : "var(--color-brown)",
          transition: `color 0.4s cubic-bezier(0.44, 0, 0.56, 1)`,
        }}
      >
        {title}
      </ButtonSm>
    </Link>
  );
}

/**
 * Brands nav item — the label opens a panel of brands instead of navigating,
 * on every breakpoint. "All brands" inside the panel keeps the shop reachable.
 */
function BrandsNavItem({
  title,
  active,
  brands,
}: {
  title:  string;
  active: boolean;
  brands: PagedList<FilterItem>;
}) {
  const pathname = usePathname();
  const [open,    setOpen]    = useState(false);
  const [hovered, setHovered] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const on = active || hovered || open;

  // A click-driven panel needs an explicit way out.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Brand links only change the query, so the route effect above cannot close
  // the panel on its own — but a jump to another page still should.
  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <div ref={wrapRef} className="relative flex items-center">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-current={active ? "page" : undefined}
        className="relative flex flex-row items-center justify-center gap-[6px] px-[12px] py-[6px] rounded-none overflow-clip bg-transparent border-none cursor-pointer"
      >
        <span
          aria-hidden
          className={`absolute inset-0 bg-plum rounded-none transition-opacity duration-300 ease-[cubic-bezier(0.44,0,0.56,1)] ${
            on ? "opacity-100" : "opacity-0"
          }`}
        />
        <ButtonSm
          className="relative z-10 text-left"
          style={{
            color: on ? "var(--color-lavender)" : "var(--color-brown)",
            transition: `color 0.4s cubic-bezier(0.44, 0, 0.56, 1)`,
          }}
        >
          {title}
        </ButtonSm>
        <ChevronDown
          size={14}
          strokeWidth={1.5}
          aria-hidden
          className="relative z-10 shrink-0"
          style={{
            color: on ? "var(--color-lavender)" : "var(--color-brown)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: `color 0.4s cubic-bezier(0.44, 0, 0.56, 1), transform 0.3s cubic-bezier(0.44, 0, 0.56, 1)`,
          }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            className="absolute top-full left-1/2 -translate-x-1/2 pt-[8px] z-[110]"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: EASE }}
          >
            <div className="min-w-[220px] max-h-[60vh] overflow-y-auto flex flex-col justify-start items-stretch gap-[2px] bg-lavender border border-dashed border-beige rounded-none p-[8px]">
              <BrandMenuLink href={brandHref()} label="All brands" onNavigate={() => setOpen(false)} />
              {brands.items.map((brand) => (
                <BrandMenuLink
                  key={brand.id}
                  href={brandHref(brand.slug)}
                  label={brand.name}
                  onNavigate={() => setOpen(false)}
                />
              ))}
              {/* The panel scrolls, but a shop with a hundred brands should not
                  make the shopper drag through all of them to reach the end -
                  and the ones past this page have not been fetched anyway. */}
              <PagedListControls
                remaining={brands.total - brands.items.length}
                busy={brands.loadingMore}
                onMore={brands.loadMore}
                className="px-[10px] pb-[4px]"
              />
              {/* Only while the request is in flight — a list that comes back empty
                  leaves "All brands" standing on its own rather than a stuck spinner. */}
              {brands.loading && (
                <BodySm className="!text-brown !text-left px-[10px] py-[8px]">Loading…</BodySm>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BrandMenuLink({
  href,
  label,
  onNavigate,
}: {
  href:       string;
  label:      string;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onNavigate}
      className="w-full flex flex-row justify-start items-center px-[10px] py-[8px] rounded-none transition-colors duration-300 ease-[cubic-bezier(0.44,0,0.56,1)] hover:bg-blush"
    >
      {/* Brand names are set as their owners write them — no uppercasing. */}
      <ButtonSm className="!text-left !text-[14px] !text-brown !normal-case">{label}</ButtonSm>
    </Link>
  );
}

function WishlistLink({ className = "" }: { className?: string }) {
  const { count, ready } = useWishlist();
  const [hovered, setHovered] = useState(false);
  const filled = hovered;

  return (
    <Link
      href="/wishlist"
      aria-label={ready && count > 0 ? `Wishlist, ${count} saved` : "Wishlist"}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative flex items-center justify-center w-[30px] h-[42px] tablet:w-[43px] tablet:h-[43px] desktop:w-[44px] desktop:h-[44px] rounded-none ${className}`}
    >
      {/* Two stacked hearts crossfade — the SVG `fill` attribute cannot be
          CSS-transitioned, so opacity does the work instead. */}
      <span className="relative flex items-center justify-center w-[21px] h-[21px] tablet:w-[22px] tablet:h-[22px] desktop:w-[23px] desktop:h-[23px]">
        <motion.span
          className="absolute inset-0 flex items-center justify-center"
          animate={{ opacity: filled ? 0 : 1 }}
          transition={{ duration: 0.3, ease: EASE }}
        >
          <Heart strokeWidth={1.5} className="text-brown w-[21px] h-[21px] tablet:w-[22px] tablet:h-[22px] desktop:w-[23px] desktop:h-[23px]" fill="none" />
        </motion.span>
        <motion.span
          className="absolute inset-0 flex items-center justify-center opacity-0"
          animate={{ opacity: filled ? 1 : 0, scale: filled ? 1 : 0.8 }}
          transition={{ duration: 0.3, ease: EASE }}
        >
          <Heart strokeWidth={1.5} className="text-plum w-[21px] h-[21px] tablet:w-[22px] tablet:h-[22px] desktop:w-[23px] desktop:h-[23px]" fill="var(--color-plum)" />
        </motion.span>
      </span>
      {ready && count > 0 && (
        <span className="absolute top-[3px] right-[1px] min-w-[17px] h-[17px] px-[4px] flex items-center justify-center bg-plum rounded-full">
          <span className="font-clash font-medium text-[11px] leading-none text-white">{count}</span>
        </span>
      )}
    </Link>
  );
}

function CartLink({ className = "" }: { className?: string }) {
  const { count, ready } = useCart();
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href="/cart"
      aria-label={ready && count > 0 ? `Cart, ${count} items` : "Cart"}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative flex items-center justify-center w-[30px] h-[42px] tablet:w-[43px] tablet:h-[43px] desktop:w-[44px] desktop:h-[44px] rounded-none ${className}`}
    >
      <motion.span
        className="flex items-center justify-center"
        animate={{ scale: hovered ? 1.08 : 1 }}
        transition={{ duration: 0.3, ease: EASE }}
      >
        <ShoppingBag
          strokeWidth={1.5}
          fill="none"
          className={`${hovered ? "text-plum" : "text-brown"} w-[21px] h-[21px] tablet:w-[22px] tablet:h-[22px] desktop:w-[23px] desktop:h-[23px]`}
          style={{ transition: "color 0.3s cubic-bezier(0.44,0,0.56,1)" }}
        />
      </motion.span>
      {ready && count > 0 && (
        <span className="absolute top-[3px] right-[1px] min-w-[17px] h-[17px] px-[4px] flex items-center justify-center bg-plum rounded-full">
          <span className="font-clash font-medium text-[11px] leading-none text-white">{count}</span>
        </span>
      )}
    </Link>
  );
}

/**
 * The account icon always points at `/account`; whether that lands on the
 * profile or bounces to sign-in is decided on the server, so the header never
 * has to know if anyone is signed in.
 */
function AccountLink({ className = "" }: { className?: string }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href="/account"
      aria-label="Your account"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative flex items-center justify-center w-[30px] h-[42px] tablet:w-[43px] tablet:h-[43px] desktop:w-[44px] desktop:h-[44px] rounded-none ${className}`}
    >
      <motion.span
        className="flex items-center justify-center"
        animate={{ scale: hovered ? 1.08 : 1 }}
        transition={{ duration: 0.3, ease: EASE }}
      >
        <User
          strokeWidth={1.5}
          fill="none"
          className={`${hovered ? "text-plum" : "text-brown"} w-[21px] h-[21px] tablet:w-[22px] tablet:h-[22px] desktop:w-[23px] desktop:h-[23px]`}
          style={{ transition: "color 0.3s cubic-bezier(0.44,0,0.56,1)" }}
        />
      </motion.span>
    </Link>
  );
}

function Hamburger({ open }: { open: boolean }) {
  return (
    <span className="relative block w-[28px] h-[13px] tablet:w-[26px] tablet:h-[12px]" aria-hidden>
      <motion.span
        className="absolute left-0 h-[1.5px] w-full bg-brown rounded-none"
        animate={open ? { top: 6, rotate: 45 } : { top: 0, rotate: 0 }}
        transition={{ duration: 0.3, ease: EASE }}
      />
      <motion.span
        className="absolute left-0 h-[1.5px] w-full bg-brown rounded-none"
        animate={open ? { top: 6, rotate: -45 } : { top: 12, rotate: 0 }}
        transition={{ duration: 0.3, ease: EASE }}
      />
    </span>
  );
}

/** Drawer counterpart of {@link BrandsNavItem} — taps expand in place. */
function BrandsDrawerItem({
  title,
  active,
  brands,
  onNavigate,
}: {
  title:      string;
  active:     boolean;
  brands:     PagedList<FilterItem>;
  onNavigate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="w-full flex flex-col justify-start items-start gap-[12px]">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="w-full flex flex-row justify-between items-center gap-[10px] pb-[12px] rounded-none border-0 border-b border-dashed border-beige bg-transparent cursor-pointer"
      >
        <ButtonSm className={`!text-left !text-[16px] ${active ? "!text-plum" : "!text-brown"}`}>
          {title}
        </ButtonSm>
        <ChevronDown
          size={18}
          strokeWidth={1.5}
          aria-hidden
          className={active ? "text-plum" : "text-brown"}
          style={{
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.3s cubic-bezier(0.44, 0, 0.56, 1)",
          }}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            className="w-full overflow-clip"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          >
            <div className="w-full flex flex-col justify-start items-start gap-[12px] pl-[12px] border-l border-dashed border-beige">
              <Link href={brandHref()} onClick={onNavigate} className="w-full">
                <ButtonSm className="!text-left !text-[14px] !text-brown !normal-case">All brands</ButtonSm>
              </Link>
              {brands.items.map((brand) => (
                <Link key={brand.id} href={brandHref(brand.slug)} onClick={onNavigate} className="w-full">
                  <ButtonSm className="!text-left !text-[14px] !text-brown !normal-case">{brand.name}</ButtonSm>
                </Link>
              ))}
              <PagedListControls
                remaining={brands.total - brands.items.length}
                busy={brands.loadingMore}
                onMore={brands.loadMore}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Header() {
  const pathname = usePathname();
  // One request for the whole header: the desktop panel and the drawer render
  // the same list, so they share the same page of it. Sorted by name to match
  // the shop's A–Z index — the same ten brands in two orders reads as two
  // different lists.
  const brands = useFilterOptions("brands", BRAND_MENU_PAGE_SIZE, "name");
  const [open,     setOpen]     = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Close the drawer whenever navigation lands on a new route.
  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useScrollLock(open);

  // Escape closes the drawer.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  // Contact opens straight into content rather than a hero image, so it is the
  // only page where the header needs its own edge.
  const bordered = pathname.startsWith("/contact");

  return (
    <>
      <header
        className={`sticky top-0 z-[100] w-full rounded-none border-b border-dashed transition-colors duration-300 ${
          scrolled ? "bg-lavender/95 backdrop-blur-md" : "bg-lavender/75 backdrop-blur-sm"
        } ${bordered ? "border-beige" : "border-transparent"}`}
      >
        <div className="relative w-full max-w-[1920px] mx-auto flex flex-row justify-between items-center rounded-none
          h-[60px] px-[16px]
          tablet:h-[68px] tablet:px-[24px]
          desktop:h-[72px] desktop:px-[32px]">

          {/* Left group — trigger then wordmark on mobile, wordmark alone from
              tablet up. The 13px gap plus the trigger's own 8px of padding adds
              up to the same 21px of daylight the wishlist and cart icons leave
              between their glyphs. */}
          <div className="flex flex-row items-center gap-[13px]">

            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              aria-expanded={open}
              className="tablet:hidden flex items-center justify-center w-[44px] h-[44px] -ml-[8px] rounded-none bg-transparent border-none cursor-pointer"
            >
              <Hamburger open={false} />
            </button>

            <Link href="/" className="flex items-center shrink-0" aria-label="GLAZE — home">
              <span className="block w-[112px] tablet:w-[128px] desktop:w-[142px]">
                <Logomark tone="plum" />
              </span>
            </Link>

          </div>

          {/* Centred nav — absolute so the wordmark and actions never shift it off-centre */}
          <nav className="hidden tablet:flex absolute left-1/2 -translate-x-1/2 flex-row items-center gap-[8px] desktop:gap-[16px]">
            {NAV.map(({ title, href, submenu }) =>
              submenu ? (
                <BrandsNavItem key={href} title={title} active={isActive(href)} brands={brands} />
              ) : (
                <NavLink key={href} title={title} href={href} active={isActive(href)} />
              )
            )}
          </nav>

          {/* Right side */}
          <div className="flex flex-row items-center gap-0">
            <AccountLink />
            <WishlistLink />
            <CartLink className="-mr-[6px]" />
          </div>

        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <div className="tablet:hidden fixed inset-0 z-[200]">

            <motion.div
              className="absolute inset-0 bg-brown/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
              onClick={() => setOpen(false)}
            />

            <motion.aside
              className="absolute top-0 left-0 h-full w-[300px] max-w-[85vw] bg-lavender flex flex-col justify-start items-start gap-[40px] px-[16px] py-[14px] rounded-none overflow-y-auto overscroll-contain border-r border-dashed border-beige"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={PANEL}
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
            >

              <div className="w-full flex flex-row justify-between items-center pb-[14px] border-b border-dashed border-beige">
                <span className="block w-[112px]">
                  <Logomark tone="plum" />
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="flex items-center justify-center w-[44px] h-[44px] -mr-[8px] rounded-none bg-transparent border-none cursor-pointer"
                >
                  <Hamburger open />
                </button>
              </div>

              <nav className="w-full flex flex-col justify-start items-start gap-[16px]">
                {NAV.map(({ title, href, submenu }) =>
                  submenu ? (
                    <BrandsDrawerItem
                      key={href}
                      title={title}
                      active={isActive(href)}
                      brands={brands}
                      onNavigate={() => setOpen(false)}
                    />
                  ) : (
                    <Link
                      key={href}
                      href={href}
                      aria-current={isActive(href) ? "page" : undefined}
                      className="w-full flex flex-row justify-start items-center gap-[10px] pb-[12px] rounded-none border-b border-dashed border-beige"
                    >
                      <ButtonSm className={`!text-left !text-[16px] ${isActive(href) ? "!text-plum" : "!text-brown"}`}>
                        {title}
                      </ButtonSm>
                    </Link>
                  )
                )}
              </nav>

              <div className="w-full mt-auto flex flex-col justify-start items-start gap-[4px]">
                <BodySm className="!text-brown !text-left">Korean skincare, curated</BodySm>
                <a href="https://glaze.alinsafawi.com" target="_blank" rel="noopener noreferrer">
                  <BodySm className="!text-plum !text-left">glaze.alinsafawi.com</BodySm>
                </a>
              </div>

            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
