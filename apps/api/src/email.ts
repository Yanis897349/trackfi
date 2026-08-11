import { getAppOrigin, getAuthBaseUrl } from "./config"
import type { Bindings } from "./types"

type EmailKind = "invite" | "reset" | "verification" | "waitlist"

interface SendEmailInput {
  env: Bindings
  html: string
  idempotencyKey?: string
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

function emailLayout(content: string) {
  return `<!doctype html><html><body style="margin:0;background:#f5f5f5;font-family:Arial,sans-serif;color:#171717"><div style="max-width:560px;margin:0 auto;padding:40px 20px"><div style="background:#fff;border:1px solid #e5e5e5;border-radius:16px;padding:32px"><p style="margin:0 0 24px;font-size:14px;font-weight:700">Trackfi</p>${content}</div><p style="color:#737373;font-size:12px;line-height:18px;margin:18px 4px">You received this transactional message because your email was used with Trackfi.</p></div></body></html>`
}

function emailButton(label: string, url: string) {
  const safeUrl = escapeHtml(url)
  return `<a href="${safeUrl}" style="display:inline-block;background:#171717;color:#fff;text-decoration:none;border-radius:9px;padding:11px 16px;font-size:14px;font-weight:600">${escapeHtml(label)}</a>`
}

async function sendEmail(input: SendEmailInput) {
  if (!input.env.RESEND_API_KEY) {
    if (getAuthBaseUrl(input.env).includes("localhost")) return
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
      html: emailLayout(input.html),
      text: input.text,
      tags: [{ name: "type", value: input.type }],
    }),
  })

  if (!response.ok) {
    throw new Error(`Resend rejected the email with status ${response.status}`)
  }
}

export function sendWaitlistConfirmation(env: Bindings, email: string) {
  return sendEmail({
    env,
    to: email,
    type: "waitlist",
    subject: "You're on the Trackfi waitlist",
    idempotencyKey: `waitlist-confirmation/${email}`,
    html: '<h1 style="font-size:24px;margin:0 0 12px">You’re on the list.</h1><p style="font-size:15px;line-height:24px;margin:0;color:#525252">We’ll email you when your Trackfi access is ready.</p>',
    text: "You're on the Trackfi waitlist. We'll email you when your access is ready.",
  })
}

export function sendInvitation(env: Bindings, email: string, token: string) {
  const url = `${getAppOrigin(env)}/register?invite=${encodeURIComponent(token)}`
  return sendEmail({
    env,
    to: email,
    type: "invite",
    subject: "Your Trackfi invitation is ready",
    idempotencyKey: `waitlist-invitation/${email}/${token.slice(0, 16)}`,
    html: `<h1 style="font-size:24px;margin:0 0 12px">Welcome to Trackfi.</h1><p style="font-size:15px;line-height:24px;margin:0 0 24px;color:#525252">Your invitation is valid for seven days.</p>${emailButton("Create your account", url)}`,
    text: `Your Trackfi invitation is valid for seven days. Create your account: ${url}`,
  })
}

export function sendVerificationEmail(
  env: Bindings,
  email: string,
  url: string
) {
  return sendEmail({
    env,
    to: email,
    type: "verification",
    subject: "Verify your Trackfi email",
    html: `<h1 style="font-size:24px;margin:0 0 12px">Verify your email.</h1><p style="font-size:15px;line-height:24px;margin:0 0 24px;color:#525252">Confirm this address to finish setting up your account.</p>${emailButton("Verify email", url)}`,
    text: `Verify your Trackfi email: ${url}`,
  })
}

export function sendPasswordReset(env: Bindings, email: string, url: string) {
  return sendEmail({
    env,
    to: email,
    type: "reset",
    subject: "Reset your Trackfi password",
    html: `<h1 style="font-size:24px;margin:0 0 12px">Reset your password.</h1><p style="font-size:15px;line-height:24px;margin:0 0 24px;color:#525252">Use this secure link to choose a new password.</p>${emailButton("Reset password", url)}`,
    text: `Reset your Trackfi password: ${url}`,
  })
}
