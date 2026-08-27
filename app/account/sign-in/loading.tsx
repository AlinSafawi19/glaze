import { SectionLoading } from "@/components/ui/section-loading";

/**
 * The page itself is dynamic — it reads the session cookie and replays it to
 * the backend to decide between the form and a redirect to /account — so a tap
 * on "Sign in" would otherwise sit on the old page until that round trip
 * lands. This is the same in-page wait the wishlist shows, inside the sign-in
 * shell so the loader holds the page's own background and height.
 */
export default function Loading() {
  return (
    <main>
      <section className="w-full flex flex-col justify-start items-center gap-[10px] p-0 rounded-none bg-caledon">
        <div
          className="w-full max-w-[1920px] flex flex-col justify-start items-center
            py-[64px] px-[16px]
            tablet:py-[96px] tablet:px-[24px]
            desktop:py-[120px] desktop:px-[32px]"
        >
          <SectionLoading />
        </div>
      </section>
    </main>
  );
}
