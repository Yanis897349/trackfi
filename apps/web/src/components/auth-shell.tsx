import type { ReactNode } from "react"

import { m } from "../lib/i18n"
import { TrackfiBrand } from "./trackfi-brand"

export const authInputClassName =
  "h-10 rounded-lg border-[#e4e4e7] bg-white px-3 focus-visible:border-[#2563eb] focus-visible:ring-[#2563eb]/20"

export const authPrimaryButtonClassName =
  "h-10 rounded-md bg-[#1d4ed8] text-blue-50 hover:bg-[#1e40af]"

export function AuthShell({
  children,
  description,
  eyebrow,
  title,
}: {
  children: ReactNode
  description: string
  eyebrow?: string | undefined
  title: string
}) {
  const benefits = [
    m.auth_brand_benefit_visibility(),
    m.auth_brand_benefit_controls(),
    m.auth_brand_benefit_reports(),
  ]

  return (
    <main className="min-h-svh bg-[#fafafa] p-4 text-[#111318]">
      <div className="mx-auto grid min-h-[calc(100svh-2rem)] w-full max-w-[1408px] lg:grid-cols-[42%_58%] xl:grid-cols-[600px_minmax(0,1fr)]">
        <aside className="hidden min-h-[calc(100svh-2rem)] flex-col justify-between rounded-2xl bg-[#111318] px-8 py-10 text-white lg:flex xl:px-11">
          <div className="flex items-center justify-between gap-6">
            <TrackfiBrand inverse />
            <p className="font-mono text-[10px] font-medium tracking-[0.12em] text-[#9ca3af] uppercase">
              {m.auth_brand_workspace_label()}
            </p>
          </div>

          <div className="max-w-lg space-y-6">
            <p
              aria-hidden="true"
              className="text-3xl font-medium text-[#3b82f6]"
            >
              +
            </p>
            <h2 className="text-4xl leading-[1.05] font-semibold tracking-[-0.03em] text-balance xl:text-[46px]">
              {m.auth_brand_title()}
            </h2>
            <p className="max-w-[450px] text-base leading-6 text-[#a1a1aa]">
              {m.auth_brand_description()}
            </p>
            <ul className="space-y-3 text-sm text-[#e4e4e7]">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className="font-mono font-semibold text-[#3b82f6]"
                  >
                    +
                  </span>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-end text-xs text-[#71717a]">
            <p className="font-mono text-[10px] tracking-[0.1em] text-[#52525b] uppercase">
              + Trackfi / 2026
            </p>
          </div>
        </aside>

        <section className="flex min-h-[calc(100svh-2rem)] min-w-0 flex-col px-2 py-2 sm:px-8 sm:py-6 lg:px-10 xl:px-14">
          <header className="flex h-7 items-center">
            <TrackfiBrand compact plainMark />
          </header>
          <div className="flex flex-1 items-center justify-center py-10">
            <div className="w-full max-w-[430px]">
              <div className="mb-7 space-y-2.5">
                {eyebrow && (
                  <p className="flex items-center gap-2 font-mono text-[11px] font-medium tracking-[0.1em] text-[#71717a] uppercase">
                    <span
                      aria-hidden="true"
                      className="text-[13px] text-[#2563eb]"
                    >
                      +
                    </span>
                    {eyebrow}
                  </p>
                )}
                <h1 className="text-[34px] leading-tight font-semibold tracking-[-0.025em]">
                  {title}
                </h1>
                <p className="text-[15px] leading-[1.45] text-[#71717a]">
                  {description}
                </p>
              </div>
              {children}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

export function FormMessage({
  children,
  tone = "error",
}: {
  children: ReactNode
  tone?: "error" | "success"
}) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={
        tone === "error"
          ? "text-sm text-destructive"
          : "text-sm text-foreground"
      }
    >
      {children}
    </p>
  )
}
