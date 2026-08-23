import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { OutlineButton } from "@/components/ui/button";
import {
  H2,
  H4,
  ItalicBodyLg,
  SubtitleMd,
  BodySm,
  ItalicBodySm,
} from "@/components/ui/typography";
import { customerOrders, readToken, type CustomerOrder } from "@/lib/account";

export const metadata = { title: "Your orders — GLAZE" };

const DATE = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** Delivered reads as settled, cancelled as struck — everything else is in flight. */
function statusTone(status: string): string {
  if (status === "Delivered") return "bg-blush";
  if (status === "Cancelled") return "bg-dusty";
  return "bg-berry";
}

function OrderCard({ order }: { order: CustomerOrder }) {
  return (
    <article className="w-full flex flex-col gap-[24px] bg-white p-[24px] tablet:p-[32px] rounded-none">
      <div className="w-full flex flex-wrap justify-between items-start gap-[16px] pb-[16px] border-b border-dashed border-beige">
        <div className="flex flex-col gap-[4px]">
          <H4 className="!text-black !text-left">Order {order.Reference}</H4>
          <ItalicBodySm className="!text-brown !text-left">
            {DATE.format(new Date(order.Placed))} · {order.Payment}
          </ItalicBodySm>
        </div>
        <div className={`flex items-center px-[16px] py-[8px] rounded-none ${statusTone(order.Status)}`}>
          <SubtitleMd className="!text-black !text-left w-auto">{order.Status}</SubtitleMd>
        </div>
      </div>

      <div className="w-full flex flex-col gap-[16px]">
        {order.Items.map((item) => (
          <div key={item.id} className="w-full flex flex-row justify-start items-center gap-[12px]">
            <div className="relative w-[56px] h-[70px] shrink-0 overflow-clip rounded-none bg-dusty">
              {item.Image && (
                <Image
                  src={item.Image}
                  alt=""
                  fill
                  sizes="56px"
                  quality={100}
                  unoptimized
                  className="object-cover object-center"
                />
              )}
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-[2px]">
              <Link href={`/products/${item.Slug}`}>
                <BodySm className="!text-black !text-left">{item.Title}</BodySm>
              </Link>
              <BodySm className="!text-brown !text-left">
                {item.Qty} × ${item.UnitPrice}
              </BodySm>
            </div>
            <BodySm className="!text-black !text-right shrink-0">
              ${Number(item.UnitPrice) * item.Qty}
            </BodySm>
          </div>
        ))}
      </div>

      <div className="w-full flex flex-col gap-[8px] pt-[16px] border-t border-dashed border-beige">
        <div className="w-full flex flex-row justify-between items-center">
          <SubtitleMd className="!text-black !text-left">Total</SubtitleMd>
          <SubtitleMd className="!text-black !text-right">${order.Total}</SubtitleMd>
        </div>
        <BodySm className="!text-brown !text-left [text-wrap:balance]">
          Delivered to {order.Address}, {order.City} · {order.Phone}
        </BodySm>
      </div>
    </article>
  );
}

export default async function OrdersPage() {
  // The cookie is checked first so a signed-out visitor is sent to sign in
  // rather than shown an empty list that looks like lost orders.
  if (!(await readToken())) redirect("/account/sign-in?next=/account/orders");

  const { customer, orders } = await customerOrders();
  if (!customer) redirect("/account/sign-in?next=/account/orders");

  return (
    <main>
      <section className="w-full flex flex-col justify-start items-center gap-[10px] p-0 rounded-none bg-caledon">
        {/* Matches the account page's width so the two centre identically. */}
        <div
          className="w-full max-w-[1196px] flex flex-col justify-start items-start rounded-none
            gap-[32px] py-[48px] px-[16px]
            tablet:gap-[40px] tablet:py-[64px] tablet:px-[24px]
            desktop:gap-[48px] desktop:py-[80px] desktop:px-[32px]"
        >
          <div className="w-full flex flex-wrap justify-between items-end gap-[16px]">
            <div className="flex flex-col gap-[4px]">
              <H2 className="!text-black !text-left">YOUR ORDERS</H2>
              <ItalicBodyLg className="!text-brown !text-left">
                {orders.length === 0
                  ? "nothing yet"
                  : `${orders.length} order${orders.length === 1 ? "" : "s"}`}
              </ItalicBodyLg>
            </div>
            <Link href="/account">
              <OutlineButton icon={null}>Account details</OutlineButton>
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="w-full flex flex-col justify-center items-center gap-[24px] py-[48px] border border-dashed border-beige rounded-none">
              <H4 className="!text-brown !text-center">No orders yet</H4>
              <ItalicBodySm className="!text-brown !text-center max-w-[420px] [text-wrap:balance]">
                Anything you order will appear here, with its status as we pack and deliver it.
              </ItalicBodySm>
              <Link href="/shop-all">
                <OutlineButton icon={null}>Shop all</OutlineButton>
              </Link>
            </div>
          ) : (
            <div className="w-full flex flex-col gap-[24px]">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
