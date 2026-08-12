const errorMessages: Record<string, string> = {
  currency_required:
    "Choose an account currency in Settings before adding financial items.",
  delete_confirmation_required: "Confirm permanent deletion before continuing.",
  email_delivery_failed:
    "The change was saved, but the email could not be delivered. Try resending it.",
  invalid_email: "Enter a valid email address.",
  invalid_origin: "This request came from an untrusted origin.",
  invalid_request: "Check the entered values and try again.",
  not_found: "That item no longer exists.",
  rate_limited: "Too many attempts. Please wait a moment and try again.",
  request_failed: "Something went wrong. Please try again.",
  turnstile_failed: "Please complete the security check and try again.",
}

export function humanizeError(error: unknown) {
  const code = error instanceof Error ? error.message : "request_failed"
  return errorMessages[code] ?? "Something went wrong. Please try again."
}
