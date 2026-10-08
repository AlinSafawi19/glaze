import { redirect } from "next/navigation";

import { SignUpForm } from "@/components/ui/account-forms";
import { currentCustomer } from "@/lib/account";

export const metadata = { title: "Create account" };

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  if (await currentCustomer()) redirect(next ?? "/account");

  return (
    <main>
      <section className="w-full flex flex-col justify-start items-center gap-[10px] p-0 rounded-none bg-caledon">
        <div
          className="w-full max-w-[1920px] flex flex-col justify-start items-center
            py-[64px] px-[16px]
            tablet:py-[96px] tablet:px-[24px]
            desktop:py-[120px] desktop:px-[32px]"
        >
          <SignUpForm next={next} />
        </div>
      </section>
    </main>
  );
}
