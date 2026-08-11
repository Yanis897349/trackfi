import { z } from "zod"

import { isDateOnly } from "./date"
import { subscriptionCadences } from "./subscriptions"

export const subscriptionCategories = [
  "software",
  "entertainment",
  "utilities",
  "finance",
  "health",
  "education",
  "shopping",
  "other",
] as const
export const subscriptionStatuses = ["active", "paused", "archived"] as const
export const subscriptionFilters = [
  "current",
  ...subscriptionStatuses,
  "all",
] as const

const websiteSchema = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => {
    if (!value) return true
    try {
      const url = new URL(value)
      return url.protocol === "http:" || url.protocol === "https:"
    } catch {
      return false
    }
  })

const subscriptionFields = {
  name: z.string().trim().min(1).max(100),
  amountMinor: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  cadence: z.enum(subscriptionCadences),
  billingAnchor: z.string().refine(isDateOnly),
  category: z.enum(subscriptionCategories),
  websiteUrl: websiteSchema,
  notes: z.string().trim().max(2000),
}

export const subscriptionCreateSchema = z.object({
  ...subscriptionFields,
  websiteUrl: subscriptionFields.websiteUrl.optional().default(""),
  notes: subscriptionFields.notes.optional().default(""),
})

export const subscriptionUpdateSchema = z
  .object(subscriptionFields)
  .partial()
  .extend({ status: z.enum(subscriptionStatuses).optional() })
  .refine((value) => Object.keys(value).length > 0)

export type SubscriptionCategory = (typeof subscriptionCategories)[number]
export type SubscriptionStatus = (typeof subscriptionStatuses)[number]
export type SubscriptionCreateInput = z.infer<typeof subscriptionCreateSchema>
export type SubscriptionUpdateInput = z.infer<typeof subscriptionUpdateSchema>
