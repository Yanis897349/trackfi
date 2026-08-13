import type { Locale } from "@trackfi/localization"

import { getAppOrigin, getAuthBaseUrl } from "./config"
import * as m from "./paraglide/messages.js"
import type { Bindings } from "./types"

type EmailKind =
  | "expense-budget-approaching"
  | "expense-budget-limit"
  | "invite"
  | "reset"
  | "verification"
  | "waitlist"

interface SendEmailInput {
  env: Bindings
  html: string
  idempotencyKey?: string
  locale: Locale
  subject: string
  text: string
  to: string
  type: EmailKind
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[character] ?? character
  )
}

function emailLayout(content: string, locale: Locale) {
  return `<!doctype html><html lang="${locale}"><body style="margin:0;background:#f5f5f5;font-family:Arial,sans-serif;color:#171717"><div style="max-width:560px;margin:0 auto;padding:40px 20px"><div style="background:#fff;border:1px solid #e5e5e5;border-radius:16px;padding:32px"><p style="margin:0 0 24px;font-size:14px;font-weight:700">Trackfi</p>${content}</div><p style="color:#737373;font-size:12px;line-height:18px;margin:18px 4px">${escapeHtml(m.email_footer({}, { locale }))}</p></div></body></html>`
}

function emailButton(label: string, url: string) {
  const safeUrl = escapeHtml(url)
  return `<a href="${safeUrl}" style="display:inline-block;background:#171717;color:#fff;text-decoration:none;border-radius:9px;padding:11px 16px;font-size:14px;font-weight:600">${escapeHtml(label)}</a>`
}

async function sendEmail(input: SendEmailInput) {
  if (!input.env.RESEND_API_KEY) {
    if (getAuthBaseUrl(input.env).includes("localhost")) return { id: null }
    throw new Error("RESEND_API_KEY is not configured")
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      ...(input.idempotencyKey
        ? { "Idempotency-Key": input.idempotencyKey }
        : {}),
    },
    body: JSON.stringify({
      from: input.env.EMAIL_FROM ?? "Trackfi <onboarding@resend.dev>",
      to: [input.to],
      subject: input.subject,
      html: emailLayout(input.html, input.locale),
      text: input.text,
      tags: [{ name: "type", value: input.type }],
    }),
  })

  if (!response.ok) {
    throw new Error(`Resend rejected the email with status ${response.status}`)
  }
  const result = await response
    .json<{ id?: unknown }>()
    .catch(() => ({ id: undefined }))
  return { id: typeof result.id === "string" ? result.id : null }
}

export function sendExpenseBudgetNotification(
  env: Bindings,
  input: {
    budget: string
    email: string
    locale: Locale
    notificationId: string
    period: string
    spent: string
    threshold: number
    type: "expense_budget_approaching" | "expense_budget_limit"
  }
) {
  const url = `${getAppOrigin(env)}${input.locale === "fr" ? "/fr" : ""}/dashboard/expenses`
  const approaching = input.type === "expense_budget_approaching"
  const values = {
    budget: input.budget,
    period: input.period,
    spent: input.spent,
    threshold: input.threshold,
  }
  const subject = approaching
    ? m.email_expense_budget_approaching_subject({}, { locale: input.locale })
    : m.email_expense_budget_limit_subject({}, { locale: input.locale })
  const title = approaching
    ? m.email_expense_budget_approaching_title({}, { locale: input.locale })
    : m.email_expense_budget_limit_title({}, { locale: input.locale })
  const body = approaching
    ? m.email_expense_budget_approaching_body(values, {
        locale: input.locale,
      })
    : m.email_expense_budget_limit_body(values, { locale: input.locale })
  const button = m.email_expense_budget_button({}, { locale: input.locale })
  return sendEmail({
    env,
    locale: input.locale,
    to: input.email,
    type: approaching ? "expense-budget-approaching" : "expense-budget-limit",
    subject,
    idempotencyKey: `notification/${input.notificationId}/email`,
    html: `<h1 style="font-size:24px;margin:0 0 12px">${escapeHtml(title)}</h1><p style="font-size:15px;line-height:24px;margin:0 0 24px;color:#525252">${escapeHtml(body)}</p>${emailButton(button, url)}`,
    text: `${title}\n\n${body}\n\n${button}: ${url}`,
  })
}

export async function sendWaitlistConfirmation(
  env: Bindings,
  email: string,
  locale: Locale = "en"
) {
  await sendEmail({
    env,
    locale,
    to: email,
    type: "waitlist",
    subject: m.email_waitlist_subject({}, { locale }),
    idempotencyKey: `waitlist-confirmation/${email}`,
    html: `<h1 style="font-size:24px;margin:0 0 12px">${escapeHtml(m.email_waitlist_title({}, { locale }))}</h1><p style="font-size:15px;line-height:24px;margin:0;color:#525252">${escapeHtml(m.email_waitlist_body({}, { locale }))}</p>`,
    text: m.email_waitlist_text({}, { locale }),
  })
}

export async function sendInvitation(
  env: Bindings,
  email: string,
  token: string,
  locale: Locale = "en"
) {
  const url = `${getAppOrigin(env)}/${locale}/register?invite=${encodeURIComponent(token)}`
  await sendEmail({
    env,
    locale,
    to: email,
    type: "invite",
    subject: m.email_invite_subject({}, { locale }),
    idempotencyKey: `waitlist-invitation/${email}/${token.slice(0, 16)}`,
    html: `<h1 style="font-size:24px;margin:0 0 12px">${escapeHtml(m.email_invite_title({}, { locale }))}</h1><p style="font-size:15px;line-height:24px;margin:0 0 24px;color:#525252">${escapeHtml(m.email_invite_body({}, { locale }))}</p>${emailButton(m.email_invite_button({}, { locale }), url)}`,
    text: m.email_invite_text({ url }, { locale }),
  })
}

export async function sendVerificationEmail(
  env: Bindings,
  email: string,
  url: string,
  locale: Locale = "en"
) {
  await sendEmail({
    env,
    locale,
    to: email,
    type: "verification",
    subject: m.email_verify_subject({}, { locale }),
    html: `<h1 style="font-size:24px;margin:0 0 12px">${escapeHtml(m.email_verify_title({}, { locale }))}</h1><p style="font-size:15px;line-height:24px;margin:0 0 24px;color:#525252">${escapeHtml(m.email_verify_body({}, { locale }))}</p>${emailButton(m.email_verify_button({}, { locale }), url)}`,
    text: m.email_verify_text({ url }, { locale }),
  })
}

export async function sendPasswordReset(
  env: Bindings,
  email: string,
  url: string,
  locale: Locale = "en"
) {
  await sendEmail({
    env,
    locale,
    to: email,
    type: "reset",
    subject: m.email_reset_subject({}, { locale }),
    html: `<h1 style="font-size:24px;margin:0 0 12px">${escapeHtml(m.email_reset_title({}, { locale }))}</h1><p style="font-size:15px;line-height:24px;margin:0 0 24px;color:#525252">${escapeHtml(m.email_reset_body({}, { locale }))}</p>${emailButton(m.email_reset_button({}, { locale }), url)}`,
    text: m.email_reset_text({ url }, { locale }),
  })
}
