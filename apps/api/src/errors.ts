export function safeErrorMessage(
  error: unknown,
  fallback: string,
  maxLength = 500
) {
  return error instanceof Error ? error.message.slice(0, maxLength) : fallback
}
