export function safeContentDispositionFilename(value: string) {
  return value.replace(/["\\\r\n]/g, "_")
}
