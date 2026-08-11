const errorMessages: Record<string, string> = {
  email_delivery_failed:
    "The change was saved, but the email could not be delivered. Try resending it.",
  invalid_email: "Enter a valid email address.",
  invalid_origin: "This request came from an untrusted origin.",
  rate_limited: "Too many attempts. Please wait a moment and try again.",
  request_failed: "Something went wrong. Please try again.",
  turnstile_failed: "Please complete the security check and try again.",
}

export function humanizeError(error: unknown) {
  const code = error instanceof Error ? error.message : "request_failed"
  return errorMessages[code] ?? "Something went wrong. Please try again."
}
