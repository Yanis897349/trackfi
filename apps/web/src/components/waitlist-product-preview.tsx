import { m } from "../lib/i18n"
import { TrackfiBrand } from "./trackfi-brand"

const chartBars = [34, 42, 38, 54, 62, 70, 78, 91]

function PreviewMetric({
  change,
  label,
  positive = false,
  value,
}: {
  change: string
  label: string
  positive?: boolean
  value: string
}) {
  return (
    <div className="min-w-0 rounded-lg bg-[#f0f0f0] p-3">
      <p className="truncate font-mono text-[7px] font-semibold tracking-[0.1em] text-[#71717a] uppercase">
        {label}
      </p>
      <p className="mt-1.5 truncate text-[17px] font-semibold text-[#111318]">
        {value}
      </p>
      <p
        className={
          positive
            ? "mt-1 text-[9px] font-semibold text-[#15803d]"
            : "mt-1 text-[9px] font-semibold text-[#71717a]"
        }
      >
        {change}
      </p>
    </div>
  )
}

function UpcomingPayment({ name, price }: { name: string; price: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-white/10 py-3 first:border-t-0">
      <div>
        <p className="text-[9px] font-medium text-[#e4e4e7]">{name}</p>
        <p className="mt-0.5 font-mono text-[6px] tracking-[0.08em] text-[#71717a] uppercase">
          {m.waitlist_preview_this_week()}
        </p>
      </div>
      <p className="text-[9px] font-semibold text-white">{price}</p>
    </div>
  )
}

export function WaitlistProductPreview() {
  return (
    <div
      role="img"
      aria-label={m.waitlist_preview_label()}
      className="relative mx-auto w-full max-w-[646px] pr-10 pb-8 pl-3 sm:pr-12"
    >
      <div
        aria-hidden="true"
        className="absolute top-10 right-0 bottom-0 left-[8%] rounded-[14px] bg-[#2563eb]"
      />
      <div
        aria-hidden="true"
        className="relative z-10 w-full max-w-[558px] rounded-xl bg-[#fafafa] p-4 text-[#111318] shadow-2xl shadow-black/20 sm:p-[22px]"
      >
        <div className="flex items-center justify-between gap-4">
          <TrackfiBrand compact />
          <p className="font-mono text-[8px] font-semibold tracking-[0.1em] text-[#71717a] uppercase">
            {m.waitlist_preview_period()}
          </p>
        </div>

        <div className="mt-4">
          <p className="text-lg font-semibold tracking-[-0.02em] sm:text-[21px]">
            {m.waitlist_preview_greeting()}
          </p>
          <p className="mt-1 text-[11px] text-[#71717a]">
            {m.waitlist_preview_summary()}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2.5">
          <PreviewMetric
            label={m.waitlist_preview_net_worth()}
            value="$128,450"
            change="+8.4%"
            positive
          />
          <PreviewMetric
            label={m.waitlist_preview_monthly_flow()}
            value="+$3,240"
            change="+12.1%"
            positive
          />
          <PreviewMetric
            label={m.waitlist_preview_subscriptions()}
            value="$184"
            change="−2.0%"
          />
        </div>

        <div className="mt-4 grid grid-cols-[minmax(0,2fr)_minmax(112px,1fr)] gap-3 sm:gap-4">
          <div className="rounded-lg border border-[#e4e4e7] bg-white p-3.5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold">
                {m.waitlist_preview_growth()}
              </p>
              <p className="font-mono text-[7px] font-semibold tracking-[0.08em] text-[#71717a] uppercase">
                {m.waitlist_preview_range()}
              </p>
            </div>
            <div className="mt-5 flex h-32 items-end gap-1.5 sm:h-36 sm:gap-2">
              {chartBars.map((height, index) => (
                <div
                  key={index}
                  className={
                    index === chartBars.length - 1
                      ? "flex-1 rounded-t-sm bg-[#2563eb]"
                      : "flex-1 rounded-t-sm bg-[#d4d4d8]"
                  }
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
            <div className="mt-2 flex justify-between font-mono text-[7px] text-[#71717a]">
              {m
                .waitlist_preview_months()
                .split(" ")
                .map((month) => (
                  <span key={month}>{month}</span>
                ))}
            </div>
          </div>

          <div className="rounded-lg bg-[#111318] p-3.5">
            <p className="text-[11px] font-semibold text-white">
              {m.waitlist_preview_upcoming()}
            </p>
            <div className="mt-2">
              <UpcomingPayment
                name={m.waitlist_preview_workspace()}
                price="$24"
              />
              <UpcomingPayment name={m.waitlist_preview_cloud()} price="$18" />
              <UpcomingPayment name={m.waitlist_preview_music()} price="$11" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
