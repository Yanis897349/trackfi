import { apiFetch } from "./api"
import { intlLocale } from "./i18n"
import type { Locale } from "@trackfi/localization"

export interface UserSettings {
  currency: string | null
  locale: Locale
  updatedAt: string | null
}

export interface NotificationSettings {
  budgetAlertsEnabled: boolean
  updatedAt: string | null
}

export function settingsQueryOptions() {
  return {
    queryKey: ["settings"],
    queryFn: () => apiFetch<{ settings: UserSettings }>("/api/settings"),
  }
}

export function notificationSettingsQueryOptions() {
  return {
    queryKey: ["settings", "notifications"],
    queryFn: () =>
      apiFetch<{ preferences: NotificationSettings }>(
        "/api/settings/notifications"
      ),
  }
}

export function supportedCurrencies() {
  const locale = intlLocale()
  const names = new Intl.DisplayNames([locale], {
    type: "currency",
  })
  return Intl.supportedValuesOf("currency")
    .map((code) => ({ code, name: names.of(code) ?? code }))
    .sort((left, right) => left.name.localeCompare(right.name, locale))
}
