import type { Locale } from "@trackfi/localization"
import { LanguagesIcon } from "lucide-react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@trackfi/ui/components/select"
import { cn } from "@trackfi/ui/lib/utils"

import { authClient, type CurrentUser } from "../lib/api"
import { getLocale, m, setLocale } from "../lib/i18n"

export function LanguageSelector({
  className,
  user,
}: {
  className?: string
  user?: CurrentUser | null
}) {
  const localeItems = [
    { label: m.language_english(), value: "en" },
    { label: m.language_french(), value: "fr" },
  ] satisfies Array<{ label: string; value: Locale }>

  async function changeLocale(value: string | null) {
    if (value !== "en" && value !== "fr") return

    if (user) {
      await authClient.updateUser({ locale: value } as never).catch(() => null)
    }
    await setLocale(value)
  }

  return (
    <Select
      items={localeItems}
      value={getLocale()}
      onValueChange={changeLocale}
    >
      <SelectTrigger
        size="sm"
        aria-label={m.language_label()}
        className={cn("min-w-28", className)}
      >
        <LanguagesIcon className="size-3.5 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {localeItems.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
