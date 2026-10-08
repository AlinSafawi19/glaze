import { redirect } from "next/navigation";

import { VerifyForm } from "@/components/ui/account-forms";
import { currentCustomer } from "@/lib/account";

export const metadata = { title: "Confirm your email" };

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; next?: string }>;
}) {
  const { email, next } = await searchParams;

  if (await currentCustomer()) redirect(next ?? "/account");
  // Nothing to confirm without an address; the flow always arrives with one.
  if (!email) redirect("/account/sign-in");

  return (
    <main>
      <section className="w-full flex flex-col justify-start items-center gap-[10px] p-0 rounded-none bg-caledon">
        <div
          className="w-full max-w-[1920px] flex flex-col justify-start items-center
            py-[64px] px-[16px]
            tablet:py-[96px] tablet:px-[24px]
            desktop:py-[120px] desktop:px-[32px]"
        >
          <VerifyForm email={email} next={next} />
        </div>
      </section>
    </main>
  );
}
