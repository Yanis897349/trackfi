import { useMemo } from "react"
import type { Locale } from "@trackfi/localization"
import { EuroIcon, LanguagesIcon, ScanTextIcon } from "lucide-react"

import { Badge } from "@trackfi/ui/components/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@trackfi/ui/components/select"

import { intlLocale, m } from "../lib/i18n"
import { supportedCurrencies } from "../lib/settings"
import { SettingsCard } from "./settings-panel"

export interface GeneralSettingsDraft {
  currency: string
  locale: Locale
}

export function GeneralSettingsPreferences({
  draft,
  onChange,
}: {
  draft: GeneralSettingsDraft
  onChange(update: Partial<GeneralSettingsDraft>): void
}) {
  const currencyOptions = useMemo(
    () =>
      supportedCurrencies().map((option) => ({
        value: option.code,
        label: `${option.name} (${option.code})`,
      })),
    []
  )
  const localeOptions = [
    { label: m.language_english(), value: "en" },
    { label: m.language_french(), value: "fr" },
  ] satisfies Array<{ label: string; value: Locale }>

  return (
    <SettingsCard
      title={m.settings_regional_title()}
      description={m.settings_regional_description()}
    >
      <SettingRow
        icon={<LanguagesIcon />}
        label={m.language_label()}
        description={m.settings_language_description()}
      >
        <Select
          items={localeOptions}
          value={draft.locale}
          onValueChange={(value) => {
            if (value === "en" || value === "fr") onChange({ locale: value })
          }}
        >
          <SelectTrigger
            aria-label={m.language_label()}
            className="h-10 w-full sm:w-[330px]"
          >
            <LanguagesIcon className="size-4 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {localeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>
      <SettingRow
        icon={<EuroIcon />}
        label={m.settings_account_currency()}
        badge={m.settings_currency_relabels()}
        description={m.settings_currency_description_short()}
      >
        <Select
          items={currencyOptions}
          value={draft.currency || null}
          onValueChange={(value) =>
            onChange({ currency: value ? String(value) : "" })
          }
        >
          <SelectTrigger
            aria-label={m.settings_account_currency()}
            className="h-10 w-full sm:w-[330px]"
          >
            <EuroIcon className="size-4 text-muted-foreground" />
            <SelectValue placeholder={m.settings_choose_currency()} />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            {currencyOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>
    </SettingsCard>
  )
}

export function FormattingPreview({ draft }: { draft: GeneralSettingsDraft }) {
  const preview = formatPreview(draft)
  return (
    <div className="flex items-center gap-4 rounded-lg bg-muted px-5 py-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-background">
        <ScanTextIcon className="size-4" />
      </span>
      <div className="min-w-0 space-y-0.5">
        <p className="text-xs font-medium text-muted-foreground">
          {m.settings_formatting_preview()}
        </p>
        <p
          className="truncate font-mono text-sm font-medium"
          aria-live="polite"
        >
          {preview}
        </p>
      </div>
    </div>
  )
}

function formatPreview(draft: GeneralSettingsDraft) {
  if (!draft.currency) return m.settings_formatting_preview_unavailable()
  const locale = intlLocale(draft.locale)
  const amount = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: draft.currency,
  }).format(1240)
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(
    new Date()
  )
  const language =
    draft.locale === "fr" ? m.language_french() : m.language_english()
  return `${amount}  ·  ${date}  ·  ${language}`
}

function SettingRow({
  badge,
  children,
  description,
  icon,
  label,
}: {
  badge?: string
  children: React.ReactNode
  description: string
  icon: React.ReactNode
  label: string
}) {
  return (
    <div className="flex flex-col gap-4 border-t px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:px-6">
      <div className="flex min-w-0 flex-1 gap-3">
        <span className="mt-0.5 hidden text-muted-foreground sm:block [&>svg]:size-4">
          {icon}
        </span>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">{label}</p>
            {badge && <Badge variant="secondary">{badge}</Badge>}
          </div>
          <p className="text-[13px] leading-5 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      <div className="shrink-0 sm:self-center">{children}</div>
    </div>
  )
}
