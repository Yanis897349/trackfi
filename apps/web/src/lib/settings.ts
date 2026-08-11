import { apiFetch } from "./api"

export interface UserSettings {
  currency: string | null
  updatedAt: string | null
}

export function settingsQueryOptions() {
  return {
    queryKey: ["settings"],
    queryFn: () => apiFetch<{ settings: UserSettings }>("/api/settings"),
  }
}

export function supportedCurrencies() {
  const names = new Intl.DisplayNames([navigator.language], {
    type: "currency",
  })
  return Intl.supportedValuesOf("currency")
    .map((code) => ({ code, name: names.of(code) ?? code }))
    .sort((left, right) => left.name.localeCompare(right.name))
}
