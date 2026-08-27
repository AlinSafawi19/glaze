import { SectionLoading } from "@/components/ui/section-loading";

/**
 * Covers the whole account area, `/account` itself included.
 *
 * The header's account icon points at `/account` and lets the server decide
 * between the profile and a bounce to sign-in, so the wait a shopper actually
 * feels on "sign in" starts here — reading the session cookie and replaying it
 * to the backend — and only then redirects. Without a boundary at this level
 * the browser holds the previous page for that whole round trip, and the
 * sign-in route's own loader never gets a chance to draw.
 *
 * Nested segments inherit this unless they ship their own, so sign-up, orders
 * and verify are covered too.
 */
export default function Loading() {
  return (
    <main>
      <section className="w-full flex flex-col justify-start items-center gap-[10px] p-0 rounded-none bg-caledon">
        <div
          className="w-full max-w-[1196px] flex flex-col justify-start items-center
            py-[48px] px-[16px]
            tablet:py-[64px] tablet:px-[24px]
            desktop:py-[80px] desktop:px-[32px]"
        >
          <SectionLoading />
        </div>
      </section>
    </main>
  );
}
