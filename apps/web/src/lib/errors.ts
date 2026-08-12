import { m } from "./i18n"

const errorMessages: Record<string, () => string> = {
  currency_required: m.error_currency_required,
  delete_confirmation_required: m.error_delete_confirmation_required,
  email_delivery_failed: m.error_email_delivery_failed,
  invalid_email: m.error_invalid_email,
  invalid_receipt: m.error_invalid_receipt,
  invalid_origin: m.error_invalid_origin,
  invalid_request: m.error_invalid_request,
  not_found: m.error_not_found,
  unauthorized: m.error_unauthorized,
  forbidden: m.error_forbidden,
  unknown_flag: m.error_unknown_flag,
  already_registered: m.error_already_registered,
  not_approved: m.error_not_approved,
  rate_limited: m.error_rate_limited,
  request_failed: m.error_request_failed,
  turnstile_failed: m.error_turnstile_failed,
}

export function humanizeError(error: unknown) {
  const code = error instanceof Error ? error.message : "request_failed"
  return (errorMessages[code] ?? m.error_request_failed)()
}
