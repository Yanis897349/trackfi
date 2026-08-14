import { m } from "../lib/i18n"

const waitlistStats = () => [
  ["01", m.waitlist_stat_unified()],
  ["24/7", m.waitlist_stat_monitoring()],
  ["0", m.waitlist_stat_spreadsheets()],
]

export function WaitlistPromise() {
  return (
    <section className="flex min-h-[322px] flex-col justify-center gap-12 bg-white px-6 py-12 sm:px-12 lg:flex-row lg:items-center lg:justify-between">
      <div className="max-w-[650px] space-y-3">
        <p className="font-mono text-[10px] font-semibold tracking-[0.11em] text-[#2563eb] uppercase">
          + {m.waitlist_promise_eyebrow()}
        </p>
        <h2 className="text-3xl leading-[1.04] font-semibold tracking-[-0.03em] text-balance sm:text-[40px]">
          <span className="block">{m.waitlist_promise_title()}</span>
          <span className="block">{m.waitlist_promise_continuation()}</span>
        </h2>
      </div>
      <dl className="grid grid-cols-3 gap-6 sm:gap-12">
        {waitlistStats().map(([value, label]) => (
          <div key={label} className="flex min-w-0 flex-col">
            <dt className="order-2 text-xs leading-4 text-[#71717a]">
              {label}
            </dt>
            <dd className="order-1 mb-1.5 text-2xl font-semibold tracking-[-0.02em] sm:text-[28px]">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
