"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { H2, H4, SubtitleMd, BodySm, ItalicBodyLg } from "@/components/ui/typography";
import { OutlineButton, Button, type ButtonState } from "@/components/ui/button";
import { useCart } from "@/components/ui/use-cart";
import { useProducts } from "@/components/ui/use-products";
import { ProductImage } from "@/components/ui/product-image";
import { maxOrderable } from "@/lib/stock";
import { placeOrder } from "@/lib/actions/account";
import { useLoadingGate } from "@/components/ui/loading-gate";

const FIELD_CLS =
  "w-full h-[48px] bg-transparent outline-none border-0 border-b border-beige px-0 pt-0 pb-[8px] " +
  "font-inter font-normal text-[18px] leading-[1.2] text-black placeholder:text-beige";

/** Prefill from the signed-in account, when there is one. */
export interface CheckoutIdentity {
  name: string;
  phone: string;
  address: string;
  city: string;
  signedIn: boolean;
}

export function CheckoutForm({ identity }: { identity: CheckoutIdentity }) {
  const { lines, ready, clear } = useCart();
  const { products, loading }   = useProducts();

  const [name,    setName]    = useState(identity.name);
  const [email,   setEmail]   = useState("");
  const [phone,   setPhone]   = useState(identity.phone);
  const [address, setAddress] = useState(identity.address);
  const [city,    setCity]    = useState(identity.city);
  const [notes,   setNotes]   = useState("");

  const [state, setState] = useState<ButtonState>("default");
  const [placed, setPlaced] = useState(false);

  const items = lines
    .map((line) => {
      const product = products.find((p) => p.slug === line.slug);
      if (!product) return null;
      const available = maxOrderable(product.stock);
      return { ...product, qty: line.qty, available, short: line.qty > available };
    })
    .filter((i): i is NonNullable<typeof i> => Boolean(i));

  const subtotal = items.reduce((sum, i) => sum + i.finalPrice * i.qty, 0);
  const settled  = ready && !loading;
  // The server checks this again and is the one that decides — this only saves
  // the shopper filling in an address for an order that cannot be placed.
  const blocked  = items.filter((i) => i.short);
  const incomplete =
    blocked.length > 0 ||
    !name.trim() ||
    !phone.trim() ||
    !address.trim() ||
    !city.trim() ||
    // A guest leaves no account behind, so this is the only address the
    // confirmation can go to.
    (!identity.signedIn && !email.trim());

  // The page loader covers the wait — both the catalogue and reading the saved
  // lines back out of storage.
  useLoadingGate(!settled);

  // The confirmation replaces a long form in place, with no navigation to reset
  // the scroll — so without this the shopper is left staring at whatever was
  // under their thumb rather than at "order placed". After commit, so the short
  // page is already the one being scrolled.
  useEffect(() => {
    if (placed) window.scrollTo(0, 0);
  }, [placed]);

  async function submitOrder(e: React.FormEvent) {
    e.preventDefault();
    if (incomplete || items.length === 0) return;

    setState("loading");

    // Goes through the server so the order can be attached to the signed-in
    // account from the httpOnly cookie, which the browser cannot read — and so
    // the API key never reaches the browser.
    const result = await placeOrder(
      items.map((i) => ({ slug: i.slug, qty: i.qty })),
      { name, email, phone, address, city, notes }
    );

    if (result.error) {
      setState("error");
      return;
    }

    setState("success");
    setPlaced(true);
    clear();
  }

  if (placed) {
    return (
      <main>
        <section className="w-full flex flex-col justify-start items-center gap-[10px] p-0 rounded-none bg-caledon">
          <div className="w-full max-w-[800px] flex flex-col justify-center items-center gap-[24px] py-[80px] px-[16px] tablet:py-[120px]">
            <H2 className="w-full !text-black !text-center">ORDER PLACED</H2>
            <ItalicBodyLg className="w-full !text-brown !text-center [text-wrap:balance]">
              A confirmation email is on its way, with everything you ordered.
            </ItalicBodyLg>
            <Link href="/shop-all">
              <OutlineButton>Keep shopping</OutlineButton>
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main>
      <section className="w-full flex flex-col justify-start items-center gap-[10px] p-0 rounded-none bg-caledon">

        <div className="w-full max-w-[1920px] flex flex-col justify-start items-start rounded-none
          gap-[32px] py-[48px] px-[16px]
          tablet:gap-[40px] tablet:py-[64px] tablet:px-[24px]
          desktop:gap-[48px] desktop:py-[80px] desktop:px-[32px]">

          {settled && (
            <div className="w-full flex flex-col justify-start items-start gap-[4px] p-0 rounded-none">
              <H2 className="w-full !text-black !text-left">CHECKOUT</H2>
              <ItalicBodyLg className="w-full !text-brown !text-left">cash on delivery</ItalicBodyLg>
            </div>
          )}

          {settled && items.length === 0 && (
            <div className="w-full flex flex-col justify-center items-center gap-[24px] py-[16px]">
              <H4 className="!text-brown !text-center">Nothing to check out</H4>
              <Link href="/shop-all">
                <OutlineButton>Shop all</OutlineButton>
              </Link>
            </div>
          )}

          {settled && items.length > 0 && (
            <div className="w-full flex flex-col desktop:flex-row justify-start items-start gap-[32px] desktop:gap-[48px]">

              {/* Delivery details */}
              <form onSubmit={submitOrder} className="w-full desktop:flex-1 flex flex-col justify-start items-start gap-[32px] bg-white p-[24px] tablet:p-[40px] rounded-none">

                <H4 className="w-full !text-black !text-left">Delivery details</H4>

                {!identity.signedIn && (
                  <BodySm className="w-full !text-brown !text-left [text-wrap:balance]">
                    Checking out as a guest.{" "}
                    <Link href="/account/sign-in?next=/checkout" className="underline">
                      Sign in
                    </Link>{" "}
                    to save your details and keep this order with the rest.
                  </BodySm>
                )}

                <div className="w-full flex flex-col gap-[24px]">
                  <div className="w-full flex flex-col gap-[10px]">
                    <SubtitleMd className="w-full !text-brown !text-left">Full name</SubtitleMd>
                    <input className={FIELD_CLS} value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" required />
                  </div>

                  {/* Signed-in shoppers already have an address on file, and
                      the backend falls back to it — so this is asked of guests
                      only, rather than asking everyone for something we hold. */}
                  {!identity.signedIn && (
                    <div className="w-full flex flex-col gap-[10px]">
                      <SubtitleMd className="w-full !text-brown !text-left">Email</SubtitleMd>
                      <input
                        className={FIELD_CLS}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="jane@example.com"
                        type="email"
                        autoComplete="email"
                        required
                      />
                      <BodySm className="w-full !text-brown !text-left">
                        Where we send your order confirmation.
                      </BodySm>
                    </div>
                  )}

                  <div className="w-full flex flex-col gap-[10px]">
                    <SubtitleMd className="w-full !text-brown !text-left">Phone</SubtitleMd>
                    <input className={FIELD_CLS} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+961 70 000 000" type="tel" required />
                  </div>

                  <div className="w-full flex flex-col gap-[10px]">
                    <SubtitleMd className="w-full !text-brown !text-left">Address</SubtitleMd>
                    <input className={FIELD_CLS} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, building, floor" required />
                  </div>

                  <div className="w-full flex flex-col gap-[10px]">
                    <SubtitleMd className="w-full !text-brown !text-left">City</SubtitleMd>
                    <input className={FIELD_CLS} value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" required />
                  </div>

                  <div className="w-full flex flex-col gap-[10px]">
                    <SubtitleMd className="w-full !text-brown !text-left">Notes</SubtitleMd>
                    <textarea
                      className={`${FIELD_CLS} min-h-[80px]`}
                      style={{ resize: "vertical" }}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Anything the courier should know"
                    />
                  </div>
                </div>

                <div className="w-full bg-blush px-[16px] py-[12px] rounded-none">
                  <BodySm className="!text-brown !text-left [text-wrap:balance]">
                    Cash on delivery is the only payment method. No card details are collected at any
                    point — you pay the courier in cash when the order arrives.
                  </BodySm>
                </div>

                <div className="w-full flex justify-center">
                  {blocked.length > 0 && (
                    <div className="w-full bg-blush px-[16px] py-[12px] rounded-none">
                      <BodySm className="!text-plum !text-left [text-wrap:balance]">
                        {blocked.length === 1
                          ? `${blocked[0].title} is no longer available in that quantity.`
                          : "Some items are no longer available in the quantity saved."}{" "}
                        <Link href="/cart" className="underline">
                          Adjust your cart
                        </Link>{" "}
                        to carry on.
                      </BodySm>
                    </div>
                  )}

                  <Button type="submit" buttonState={state} disabled={incomplete} />
                </div>

                {state === "error" && (
                  <BodySm className="w-full !text-error !text-center [text-wrap:balance]">
                    We could not place the order. Please try again, or call us and we will take it over the phone.
                  </BodySm>
                )}
              </form>

              {/* Order summary */}
              <div className="w-full desktop:w-[380px] shrink-0 desktop:sticky desktop:top-[96px] flex flex-col justify-start items-start gap-[24px] bg-white p-[24px] tablet:p-[32px] rounded-none">

                <H4 className="w-full !text-black !text-left">Your order</H4>

                <div className="w-full flex flex-col gap-[16px]">
                  {items.map((item) => (
                    <div key={item.slug} className="w-full flex flex-row justify-start items-center gap-[12px]">
                      <div className="relative w-[56px] h-[70px] shrink-0 overflow-clip rounded-none">
                        <ProductImage src={item.imageSrc} sizes="56px" compact />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col gap-[2px]">
                        <BodySm className="!text-black !text-left">{item.title}</BodySm>
                        <BodySm className="!text-brown !text-left">{item.qty} × ${item.finalPrice}</BodySm>
                      </div>
                      <BodySm className="!text-black !text-right shrink-0">${item.finalPrice * item.qty}</BodySm>
                    </div>
                  ))}
                </div>

                <div className="w-full flex flex-row justify-between items-center pt-[16px] border-t border-dashed border-beige">
                  <SubtitleMd className="!text-black !text-left">Total</SubtitleMd>
                  <SubtitleMd className="!text-black !text-right">${subtotal}</SubtitleMd>
                </div>

                <Link href="/cart" className="w-full">
                  <OutlineButton className="w-full">Back to cart</OutlineButton>
                </Link>

              </div>

            </div>
          )}

        </div>
      </section>
    </main>
  );
}
