"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { ButtonLg, SubtitleMd, BodySm } from "./typography";
import { OutlineButton, FilledButton } from "./button";
import { QtyStepper } from "./qty-stepper";
import { useCart, useCartDrawer } from "./use-cart";
import { useProducts } from "./use-products";
import { ProductImage } from "./product-image";
import { maxOrderable } from "@/lib/stock";
import { useScrollLock } from "./use-scroll-lock";

// Long, low-bounce ease so the panel glides rather than snaps.
const GLIDE = { duration: 0.45, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] };
const FADE  = { duration: 0.35, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] };

export function CartDrawer() {
  const { open, setOpen } = useCartDrawer();
  const { lines, setQty, remove } = useCart();
  const { products } = useProducts();
  const pathname = usePathname();

  useScrollLock(open);

  // Never sit on top of the cart or checkout pages themselves.
  useEffect(() => { setOpen(false); }, [pathname, setOpen]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  const items = lines
    .map((line) => {
      const product = products.find((p) => p.slug === line.slug);
      if (!product) return null;
      const available = maxOrderable(product.stock);
      return { ...product, qty: line.qty, available, short: line.qty > available };
    })
    .filter((i): i is NonNullable<typeof i> => Boolean(i));

  const subtotal = items.reduce((sum, i) => sum + i.finalPrice * i.qty, 0);
  const blocked  = items.filter((i) => i.short);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[300]">

          <motion.div
            className="absolute inset-0 bg-brown/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={FADE}
            onClick={() => setOpen(false)}
          />

          <motion.aside
            className="absolute top-0 right-0 h-full w-[380px] max-w-[88vw] bg-lavender flex flex-col justify-start items-start rounded-none border-l border-dashed border-beige"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={GLIDE}
            role="dialog"
            aria-modal="true"
            aria-label="Cart"
          >

            {/* Header */}
            <div className="w-full flex flex-row justify-between items-center px-[20px] py-[16px] border-b border-dashed border-beige shrink-0">
              <ButtonLg className="!text-black !text-left !text-[18px]">Cart</ButtonLg>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close cart"
                className="flex items-center justify-center w-[36px] h-[36px] -mr-[8px] rounded-none bg-transparent border-none cursor-pointer text-brown"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            {/* Lines */}
            <div className="w-full flex-1 overflow-y-auto overscroll-contain px-[20px]">
              {items.length === 0 ? (
                <div className="w-full flex flex-col justify-center items-center gap-[16px] py-[48px]">
                  <BodySm className="!text-brown !text-center">Your cart is empty.</BodySm>
                  <Link href="/shop-all" onClick={() => setOpen(false)}>
                    <OutlineButton>Shop all</OutlineButton>
                  </Link>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.slug}
                    className="w-full flex flex-row justify-start items-start gap-[12px] py-[16px] border-b border-dashed border-beige"
                  >
                    <Link
                      href={`/products/${item.slug}`}
                      onClick={() => setOpen(false)}
                      className="relative w-[64px] h-[80px] shrink-0 overflow-clip rounded-none"
                    >
                      <ProductImage src={item.imageSrc} sizes="64px" compact />
                    </Link>

                    <div className="flex-1 min-w-0 flex flex-col gap-[6px]">
                      <div className="w-full flex flex-row justify-between items-start gap-[8px]">
                        <Link href={`/products/${item.slug}`} onClick={() => setOpen(false)} className="min-w-0">
                          <BodySm className="!text-black !text-left">{item.title}</BodySm>
                        </Link>
                        <button
                          type="button"
                          onClick={() => remove(item.slug)}
                          aria-label={`Remove ${item.title}`}
                          className="shrink-0 flex items-center justify-center w-[24px] h-[24px] rounded-none bg-transparent border-none cursor-pointer text-brown"
                        >
                          <X size={14} strokeWidth={1.5} />
                        </button>
                      </div>

                      <BodySm className="!text-brown !text-left">${item.finalPrice}</BodySm>

                      <QtyStepper
                        qty={item.qty}
                        onChange={(next) => setQty(item.slug, next)}
                        label={item.title}
                        size="sm"
                        max={item.available}
                      />

                      {item.short && (
                        <BodySm className="!text-plum !text-left">
                          {item.available === 0 ? "Out of stock" : `Only ${item.available} left`}
                        </BodySm>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="w-full flex flex-col justify-start items-start gap-[16px] px-[20px] py-[20px] border-t border-dashed border-beige shrink-0">
                <div className="w-full flex flex-row justify-between items-center">
                  <SubtitleMd className="!text-black !text-left">Total</SubtitleMd>
                  <SubtitleMd className="!text-black !text-right">${subtotal}</SubtitleMd>
                </div>
                <BodySm className="w-full !text-brown !text-left">Cash on delivery</BodySm>
                {blocked.length > 0 && (
                  <BodySm className="w-full !text-plum !text-left [text-wrap:balance]">
                    Some items are no longer available in the quantity saved — open the cart to
                    adjust them.
                  </BodySm>
                )}
                <div className="w-full flex flex-col gap-[8px]">
                  {blocked.length > 0 ? (
                    <FilledButton
                      className="w-full disabled:cursor-not-allowed disabled:opacity-60"
                      disabled
                    >
                      Checkout
                    </FilledButton>
                  ) : (
                    <Link href="/checkout" onClick={() => setOpen(false)} className="w-full">
                      <FilledButton className="w-full">Checkout</FilledButton>
                    </Link>
                  )}
                  <Link href="/cart" onClick={() => setOpen(false)} className="w-full">
                    <OutlineButton className="w-full">View cart</OutlineButton>
                  </Link>
                </div>
              </div>
            )}

          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
