import { PlusIcon } from "lucide-react"

import { buttonVariants } from "@trackfi/ui/components/button"
import { cn } from "@trackfi/ui/lib/utils"

import { localizeHref, m } from "../lib/i18n"
import { TrackfiBrand } from "./trackfi-brand"
import { WaitlistPromise } from "./waitlist-promise"
import { WaitlistProductPreview } from "./waitlist-product-preview"
import { WaitlistSignup, waitlistButtonClassName } from "./waitlist-signup"

export function WaitlistPage() {
  return (
    <main className="min-h-svh bg-[#f8f8f7] p-4 text-[#111318]">
      <div className="mx-auto flex w-full max-w-[1408px] flex-col gap-4">
        <nav className="flex h-16 items-center justify-between gap-5 px-2 sm:px-7">
          <TrackfiBrand />
          <div className="flex items-center gap-3">
            <a
              href={localizeHref("/login")}
              className="text-[13px] font-semibold hover:text-[#1d4ed8]"
            >
              {m.auth_sign_in()}
            </a>
            <a
              href="#waitlist-conversion"
              className={cn(
                buttonVariants({ size: "lg" }),
                waitlistButtonClassName,
                "hidden sm:inline-flex"
              )}
            >
              <PlusIcon />
              {m.waitlist_join_short()}
            </a>
          </div>
        </nav>

        <section className="grid gap-12 rounded-2xl bg-[#111318] px-6 py-10 text-white sm:px-10 sm:py-12 lg:min-h-[650px] lg:grid-cols-[minmax(0,610px)_minmax(0,1fr)] lg:gap-10 lg:px-14 lg:py-[52px]">
          <div className="flex min-w-0 flex-col justify-between gap-16">
            <div className="space-y-5">
              <p className="flex items-center gap-2.5 font-mono text-[10px] font-semibold tracking-[0.12em] text-[#a1a1aa] uppercase">
                <span aria-hidden="true" className="text-base text-[#60a5fa]">
                  +
                </span>
                {m.waitlist_eyebrow()}
              </p>
              <h1 className="max-w-[610px] text-[52px] leading-[0.96] font-semibold tracking-[-0.04em] text-balance sm:text-[64px] lg:max-w-[530px] xl:text-[76px]">
                {m.waitlist_title()}
              </h1>
              <p className="max-w-[530px] text-base leading-7 text-[#a1a1aa] sm:text-lg">
                {m.waitlist_description()}
              </p>
            </div>

            <WaitlistSignup />
          </div>

          <div className="hidden min-w-0 items-center md:flex">
            <WaitlistProductPreview />
          </div>
        </section>

        <WaitlistPromise />
      </div>
    </main>
  )
}
