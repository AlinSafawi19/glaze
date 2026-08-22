"use client";

import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { H2, H4, SubtitleMd, BodySm, ItalicBodyLg } from "@/components/ui/typography";
import { OutlineButton, FilledButton } from "@/components/ui/button";
import { QtyStepper } from "@/components/ui/qty-stepper";
import { useCart } from "@/components/ui/use-cart";
import { useProducts } from "@/components/ui/use-products";
import { useLoadingGate } from "@/components/ui/loading-gate";

export default function Cart() {
  const { lines, ready, setQty, remove } = useCart();
  const { products, loading } = useProducts();

  const items = lines
    .map((line) => {
      const product = products.find((p) => p.slug === line.slug);
      return product ? { ...product, qty: line.qty } : null;
    })
    .filter((i): i is NonNullable<typeof i> => Boolean(i));

  const subtotal = items.reduce((sum, i) => sum + i.finalPrice * i.qty, 0);
  const settled  = ready && !loading;

  // The page loader covers the wait — both the catalogue and reading the saved
  // lines back out of storage.
  useLoadingGate(!settled);

  return (
    <main>
      <section className="w-full flex flex-col justify-start items-center gap-[10px] p-0 rounded-none bg-caledon">

        <div className="w-full max-w-[1920px] flex flex-col justify-start items-start rounded-none
          gap-[32px] py-[48px] px-[16px]
          tablet:gap-[40px] tablet:py-[64px] tablet:px-[24px]
          desktop:gap-[48px] desktop:py-[80px] desktop:px-[32px]">

          {settled && items.length > 0 && (
            <div className="w-full flex flex-col justify-start items-start gap-[4px] p-0 rounded-none">
              <H2 className="w-full !text-black !text-left">CART</H2>
              <ItalicBodyLg className="w-full !text-brown !text-left">
                {items.length} {items.length === 1 ? "product" : "products"} ready to order
              </ItalicBodyLg>
            </div>
          )}

          {settled && items.length === 0 && (
            <div className="w-full flex flex-col justify-center items-center gap-[24px] py-[16px]">
              <H4 className="!text-brown !text-center">Your cart is empty</H4>
              <ItalicBodyLg className="!text-brown !text-center max-w-[480px] [text-wrap:balance]">
                Add a few Korean essentials and they will wait for you here.
              </ItalicBodyLg>
              <Link href="/shop-all">
                <OutlineButton>Shop all</OutlineButton>
              </Link>
            </div>
          )}

          {settled && items.length > 0 && (
            <div className="w-full flex flex-col desktop:flex-row justify-start items-start gap-[32px] desktop:gap-[48px] desktop:items-start">

              {/* Lines */}
              <div className="w-full desktop:flex-1 flex flex-col justify-start items-start gap-0">
                {items.map((item) => (
                  <div
                    key={item.slug}
                    className="w-full flex flex-row justify-start items-start gap-[16px] py-[20px] border-b border-dashed border-beige"
                  >

                    <Link href={`/products/${item.slug}`} className="relative w-[80px] h-[100px] tablet:w-[100px] tablet:h-[125px] shrink-0 overflow-clip rounded-none">
                      <Image
                        src={item.imageSrc}
                        alt=""
                        fill
                        sizes="100px"
                        quality={100}
                        unoptimized
                        className="object-cover object-center"
                      />
                    </Link>

                    <div className="flex-1 flex flex-col justify-start items-start gap-[8px] min-w-0">

                      <div className="w-full flex flex-row justify-between items-start gap-[12px]">
                        <Link href={`/products/${item.slug}`} className="min-w-0">
                          <SubtitleMd className="!text-black !text-left">{item.title}</SubtitleMd>
                        </Link>
                        <button
                          type="button"
                          onClick={() => remove(item.slug)}
                          aria-label={`Remove ${item.title}`}
                          className="shrink-0 flex items-center justify-center w-[28px] h-[28px] rounded-none bg-transparent border-none cursor-pointer text-brown"
                        >
                          <X size={16} strokeWidth={1.5} />
                        </button>
                      </div>

                      <BodySm className="!text-brown !text-left">
                        ${item.finalPrice}
                        {item.discount > 0 && <span className="line-through text-beige ml-[8px]">${item.price}</span>}
                      </BodySm>

                      <QtyStepper
                        qty={item.qty}
                        onChange={(next) => setQty(item.slug, next)}
                        label={item.title}
                      />

                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="w-full desktop:w-[380px] shrink-0 desktop:sticky desktop:top-[96px] flex flex-col justify-start items-start gap-[24px] bg-white p-[24px] tablet:p-[32px] rounded-none">

                <H4 className="w-full !text-black !text-left">Summary</H4>

                <div className="w-full flex flex-col gap-[10px]">
                  <div className="w-full flex flex-row justify-between items-center">
                    <BodySm className="!text-brown !text-left">Subtotal</BodySm>
                    <BodySm className="!text-black !text-right">${subtotal}</BodySm>
                  </div>
                  <div className="w-full flex flex-row justify-between items-center">
                    <BodySm className="!text-brown !text-left">Delivery</BodySm>
                    <BodySm className="!text-black !text-right">Calculated on delivery</BodySm>
                  </div>
                </div>

                <div className="w-full flex flex-row justify-between items-center pt-[16px] border-t border-dashed border-beige">
                  <SubtitleMd className="!text-black !text-left">Total</SubtitleMd>
                  <SubtitleMd className="!text-black !text-right">${subtotal}</SubtitleMd>
                </div>

                <div className="w-full bg-blush px-[16px] py-[12px] rounded-none">
                  <BodySm className="!text-brown !text-left [text-wrap:balance]">
                    Cash on delivery only. You pay the courier when the order reaches you.
                  </BodySm>
                </div>

                <div className="w-full flex flex-col justify-start items-start gap-[12px]">
                  <Link href="/checkout" className="w-full">
                    <FilledButton className="w-full">Checkout</FilledButton>
                  </Link>
                  <Link href="/shop-all" className="w-full">
                    <OutlineButton className="w-full">Continue shopping</OutlineButton>
                  </Link>
                </div>

              </div>

            </div>
          )}

        </div>
      </section>
    </main>
  );
}
