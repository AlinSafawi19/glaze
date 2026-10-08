import Link from "next/link";
import { redirect } from "next/navigation";

import { ProfileForm } from "@/components/ui/account-forms";
import { OutlineButton } from "@/components/ui/button";
import { SignOutButton } from "@/components/ui/sign-out-button";
import { H2, H4, ItalicBodyLg, BodySm } from "@/components/ui/typography";
import { currentCustomer } from "@/lib/account";

export const metadata = { title: "Your account" };

export default async function AccountPage() {
  const customer = await currentCustomer();
  if (!customer) redirect("/account/sign-in?next=/account");

  return (
    <main>
      <section className="w-full flex flex-col justify-start items-center gap-[10px] p-0 rounded-none bg-caledon">
        {/* 720 (form) + 32 (gap) + 380 (note) + 64 (the container's own desktop
            padding). Capping at the block's width is what centres it; at 1920
            it stranded left with a void beside the note. */}
        <div
          className="w-full max-w-[1196px] flex flex-col justify-start items-start rounded-none
            gap-[32px] py-[48px] px-[16px]
            tablet:gap-[40px] tablet:py-[64px] tablet:px-[24px]
            desktop:gap-[48px] desktop:py-[80px] desktop:px-[32px]"
        >
          <div className="w-full flex flex-wrap justify-between items-end gap-[16px]">
            <div className="flex flex-col gap-[4px]">
              <H2 className="!text-black !text-left">YOUR ACCOUNT</H2>
              <ItalicBodyLg className="!text-brown !text-left">{customer.email}</ItalicBodyLg>
            </div>
            <div className="flex flex-row items-center gap-[12px]">
              <Link href="/account/orders">
                <OutlineButton icon={null}>Your orders</OutlineButton>
              </Link>
              <SignOutButton />
            </div>
          </div>

          <div className="w-full flex flex-col desktop:flex-row justify-start items-start gap-[32px]">
            {/* Capped at the card's own width — left to grow, the column
                stretches past the card and strands the note far to the right. */}
            <div className="w-full desktop:flex-1 desktop:max-w-[720px]">
              <ProfileForm customer={customer} />
            </div>

            <div className="w-full desktop:w-[380px] shrink-0 flex flex-col gap-[16px] bg-blush p-[24px] tablet:p-[32px] rounded-none">
              <H4 className="w-full !text-black !text-left">Cash on delivery</H4>
              <BodySm className="!text-brown !text-left [text-wrap:balance]">
                We never store card details. Your saved address and phone are only used to
                prefill checkout and to reach you about an order.
              </BodySm>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
