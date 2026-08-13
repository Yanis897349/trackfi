import type { ReactNode } from "react"
import {
  AlertCircleIcon,
  CheckIcon,
  LoaderCircleIcon,
  PencilLineIcon,
} from "lucide-react"

import { Badge } from "@trackfi/ui/components/badge"
import { Button } from "@trackfi/ui/components/button"
import { cn } from "@trackfi/ui/lib/utils"

import { m } from "../lib/i18n"

export type SettingsSaveState = "error" | "saved" | "saving" | "unsaved"

export function SettingsPanelHeader({
  action,
  description,
  state,
  title,
}: {
  action?: ReactNode
  description: string
  state?: SettingsSaveState
  title: string
}) {
  return (
    <header className="space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[28px] leading-9 font-semibold tracking-tight">
          {title}
        </h2>
        {action ?? (state && <SettingsStatus state={state} />)}
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </header>
  )
}

export function SettingsStatus({ state }: { state: SettingsSaveState }) {
  const status = {
    error: {
      icon: AlertCircleIcon,
      label: m.settings_status_error(),
    },
    saved: { icon: CheckIcon, label: m.settings_status_saved() },
    saving: { icon: LoaderCircleIcon, label: m.settings_status_saving() },
    unsaved: { icon: PencilLineIcon, label: m.settings_status_unsaved() },
  }[state]
  const Icon = status.icon

  return (
    <Badge
      variant={state === "error" ? "destructive" : "secondary"}
      className={cn(
        "h-7 gap-1.5 px-2.5",
        state === "saved" &&
          "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
      )}
    >
      <Icon
        className={cn(
          state === "saving" && "animate-spin motion-reduce:animate-none"
        )}
      />
      {status.label}
    </Badge>
  )
}

export function SettingsActions({
  canDiscard,
  canSave,
  description,
  error,
  isSaving,
  onDiscard,
  onSave,
  saveLabel,
  title,
}: {
  canDiscard: boolean
  canSave: boolean
  description?: string
  error?: string
  isSaving: boolean
  onDiscard(): void
  onSave(): void
  saveLabel: string
  title?: string
}) {
  return (
    <div className="flex flex-col justify-between gap-4 pt-0.5 sm:flex-row sm:items-center">
      {(title || description || error) && (
        <div className="space-y-0.5">
          {title && <p className="text-[13px] font-medium">{title}</p>}
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          {error && (
            <p role="alert" className="pt-1 text-xs text-destructive">
              {error}
            </p>
          )}
        </div>
      )}
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={!canDiscard || isSaving}
          onClick={onDiscard}
        >
          {m.common_discard()}
        </Button>
        <Button type="button" disabled={!canSave || isSaving} onClick={onSave}>
          {isSaving ? m.common_saving() : saveLabel}
        </Button>
      </div>
    </div>
  )
}

export function SettingsCard({
  children,
  description,
  title,
}: {
  children: ReactNode
  description: string
  title: string
}) {
  return (
    <section className="overflow-hidden rounded-[10px] border bg-card">
      <div className="space-y-1 px-5 py-4 sm:px-6 sm:py-5">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="text-[13px] text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  )
}
