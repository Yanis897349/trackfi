import { useState, type ReactNode } from "react"
import { ExternalLinkIcon } from "lucide-react"

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@trackfi/ui/components/hover-card"
import { cn } from "@trackfi/ui/lib/utils"

import { brandLogoUrl } from "../lib/brandfetch"
import { formatDateOnly } from "../lib/date"
import {
  displayLabel,
  formatMoney,
  type SubscriptionCadence,
  type SubscriptionCategory,
} from "../lib/subscriptions"

export interface SubscriptionPreviewDetails {
  name: string
  amountMinor: number
  cadence: SubscriptionCadence
  category: SubscriptionCategory
  websiteUrl: string | null
  renewalDate: string
}

export function BrandLogo({
  name,
  websiteUrl,
  className,
}: {
  name: string
  websiteUrl: string | null
  className?: string
}) {
  const source = brandLogoUrl(websiteUrl)
  const [failedSource, setFailedSource] = useState<string | null>(null)

  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-xs font-semibold text-muted-foreground",
        className
      )}
      aria-hidden="true"
    >
      {source && source !== failedSource ? (
        <span className="flex size-full items-center justify-center p-[15%]">
          <img
            src={source}
            alt=""
            className="size-full rounded-[22%] object-contain"
            crossOrigin="use-credentials"
            onError={() => setFailedSource(source)}
          />
        </span>
      ) : (
        initial(name)
      )}
    </span>
  )
}

export function SubscriptionPreview({
  details,
  currency,
  children,
  align = "start",
  triggerClassName,
}: {
  details: SubscriptionPreviewDetails
  currency: string
  children?: ReactNode
  align?: "start" | "center" | "end"
  triggerClassName?: string
}) {
  return (
    <HoverCard>
      <HoverCardTrigger
        render={
          <button
            type="button"
            className={cn(
              "rounded-lg text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              triggerClassName
            )}
            aria-label={`Preview ${details.name}`}
          />
        }
      >
        {children ?? (
          <BrandLogo name={details.name} websiteUrl={details.websiteUrl} />
        )}
      </HoverCardTrigger>
      <HoverCardContent align={align} className="w-72">
        <div className="flex items-center gap-3 p-4">
          <BrandLogo
            name={details.name}
            websiteUrl={details.websiteUrl}
            className="size-10"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{details.name}</p>
            <p className="text-xs text-muted-foreground">
              {displayLabel(details.category)}
            </p>
          </div>
          <p className="font-semibold">
            {formatMoney(details.amountMinor, currency)}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 border-t p-4">
          <PreviewMetric
            label="Next renewal"
            value={formatDateOnly(details.renewalDate)}
          />
          <PreviewMetric
            label="Cadence"
            value={displayLabel(details.cadence)}
          />
        </div>
        {details.websiteUrl && (
          <a
            href={details.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between border-t px-4 py-3 font-medium text-primary hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            Open subscription <ExternalLinkIcon className="size-4" />
          </a>
        )}
      </HoverCardContent>
    </HoverCard>
  )
}

function PreviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  )
}

function initial(name: string) {
  return (
    name
      .trim()
      .match(/[\p{L}\p{N}]/u)?.[0]
      ?.toUpperCase() ?? "?"
  )
}
