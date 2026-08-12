import type { Locale } from "@trackfi/localization"
import { enUS, fr, type Locale as DateFnsLocale } from "date-fns/locale"

export * as m from "../paraglide/messages.js"
export {
  deLocalizeHref,
  deLocalizeUrl,
  extractLocaleFromUrl,
  getLocale,
  getLocaleForUrl,
  localizeHref,
  localizeUrl,
  setLocale,
  shouldRedirect,
} from "../paraglide/runtime.js"

import { getLocale } from "../paraglide/runtime.js"

export function intlLocale(locale: Locale = getLocale()) {
  return locale === "fr" ? "fr-FR" : "en-US"
}

export function dateFnsLocale(locale: Locale = getLocale()): DateFnsLocale {
  return locale === "fr" ? fr : enUS
}
