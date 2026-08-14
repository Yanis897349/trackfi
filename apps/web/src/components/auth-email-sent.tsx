import { Link } from "@tanstack/react-router"
import { ArrowLeftIcon, CheckIcon, MailCheckIcon, MailIcon } from "lucide-react"

import { Button, buttonVariants } from "@trackfi/ui/components/button"
import { cn } from "@trackfi/ui/lib/utils"

import { m } from "../lib/i18n"
import { AuthShell, authPrimaryButtonClassName } from "./auth-shell"

export function AuthEmailSent({
  description,
  email,
  feedback,
  feedbackTone = "success",
  onChangeEmail,
  onSecondaryAction,
  secondaryActionLabel,
  secondaryActionPending = false,
  statusTitle,
}: {
  description: string
  email: string
  feedback?: string
  feedbackTone?: "error" | "success"
  onChangeEmail?: (() => void) | undefined
  onSecondaryAction?: (() => void) | undefined
  secondaryActionLabel?: string | undefined
  secondaryActionPending?: boolean | undefined
  statusTitle: string
}) {
  return (
    <AuthShell
      contentClassName="max-w-[520px]"
      title={m.auth_check_inbox_title()}
      description={description}
      leading={
        <span className="flex size-14 items-center justify-center rounded-xl bg-[#eff6ff] text-[#2563eb]">
          <MailCheckIcon className="size-[26px]" aria-hidden="true" />
        </span>
      }
      footer={m.auth_check_spam_folders()}
    >
      <div className="space-y-7">
        <div
          role="status"
          className="space-y-[18px] rounded-[10px] border border-[#bbf7d0] bg-[#f0fdf4] p-5"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#16a34a] text-white">
              <CheckIcon className="size-[17px]" aria-hidden="true" />
            </span>
            <div className="min-w-0 space-y-0.5">
              <p className="text-sm font-semibold text-[#14532d]">
                {statusTitle}
              </p>
              <p className="text-xs text-[#15803d]">
                {m.auth_email_link_expiry()}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-lg border border-[#dcfce7] bg-white px-3.5 py-3">
            <p className="min-w-0 truncate font-mono text-xs font-medium text-[#111318]">
              {email}
            </p>
            <MailIcon
              className="size-4 shrink-0 text-[#71717a]"
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="space-y-2.5">
          <Link
            to="/login"
            className={cn(
              buttonVariants({ size: "lg" }),
              authPrimaryButtonClassName,
              "w-full"
            )}
          >
            <ArrowLeftIcon aria-hidden="true" />
            {m.auth_return_sign_in()}
          </Link>
          {onSecondaryAction && secondaryActionLabel && (
            <Button
              type="button"
              size="lg"
              variant="outline"
              disabled={secondaryActionPending}
              className="h-10 w-full rounded-md border-[#e4e4e7] bg-[#fafafa]"
              onClick={onSecondaryAction}
            >
              {secondaryActionLabel}
            </Button>
          )}
          {feedback && (
            <p
              role={feedbackTone === "error" ? "alert" : "status"}
              className={cn(
                "text-center text-xs",
                feedbackTone === "error" ? "text-destructive" : "text-[#15803d]"
              )}
            >
              {feedback}
            </p>
          )}
        </div>

        {onChangeEmail && (
          <p className="flex items-center justify-center gap-1.5 text-[13px] text-[#71717a]">
            {m.auth_wrong_email_address()}
            <button
              type="button"
              className="font-semibold text-[#2563eb] hover:underline"
              onClick={onChangeEmail}
            >
              {m.auth_change_email()}
            </button>
          </p>
        )}
      </div>
    </AuthShell>
  )
}
