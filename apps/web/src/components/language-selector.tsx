import { useState } from "react"
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
  triggerClassName,
  user,
}: {
  className?: string
  triggerClassName?: string
  user?: CurrentUser | null
}) {
  const [syncError, setSyncError] = useState("")
  const [saving, setSaving] = useState(false)
  const localeItems = [
    { label: m.language_english(), value: "en" },
    { label: m.language_french(), value: "fr" },
  ] satisfies Array<{ label: string; value: Locale }>

  async function changeLocale(value: string | null) {
    if (value !== "en" && value !== "fr") return

    if (user) {
      setSyncError("")
      setSaving(true)
      try {
        const result = await authClient.updateUser({ locale: value } as never)
        if (result.error) {
          setSyncError(m.language_sync_failed())
          return
        }
      } catch {
        setSyncError(m.language_sync_failed())
        return
      } finally {
        setSaving(false)
      }
    }
    await setLocale(value)
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Select
        items={localeItems}
        value={getLocale()}
        disabled={saving}
        onValueChange={changeLocale}
      >
        <SelectTrigger
          size="sm"
          aria-label={m.language_label()}
          className={cn("w-full min-w-28", triggerClassName)}
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
      {syncError && (
        <p role="alert" className="max-w-72 text-xs text-destructive">
          {syncError}
        </p>
      )}
    </div>
  )
}
