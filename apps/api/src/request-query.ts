import { z } from "zod"

export function optionalEnum<
  const Values extends readonly [string, ...string[]],
>(value: string | undefined, values: Values) {
  return value ? z.enum(values).safeParse(value) : null
}

export function optionalBoolean(value: string | undefined) {
  if (value === undefined) return null
  if (value === "true") return true
  if (value === "false") return false
  return "invalid" as const
}
