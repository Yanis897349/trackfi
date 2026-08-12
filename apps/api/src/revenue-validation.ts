import { z } from "zod"

import { isDateOnly } from "./date"
import { revenueCadences } from "./revenue"

export const revenueCategories = [
  "salary",
  "freelance",
  "business",
  "rental",
  "investments",
  "benefits",
  "pension",
  "other",
] as const
export const revenueScheduleTypes = ["scheduled", "variable"] as const
export const revenueStatuses = ["active", "paused", "archived"] as const
export const revenueFilters = ["current", ...revenueStatuses, "all"] as const

const commonFields = {
  name: z.string().trim().min(1).max(100),
  amountMinor: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  category: z.enum(revenueCategories),
  notes: z.string().trim().max(2000).optional().default(""),
}

export const revenueCreateSchema = z.discriminatedUnion("scheduleType", [
  z.object({
    ...commonFields,
    scheduleType: z.literal("scheduled"),
    cadence: z.enum(revenueCadences),
    paymentAnchor: z.string().refine(isDateOnly),
  }),
  z.object({
    ...commonFields,
    scheduleType: z.literal("variable"),
    cadence: z.null().optional().default(null),
    paymentAnchor: z.null().optional().default(null),
  }),
])

export const revenueUpdateSchema = z
  .object({
    name: commonFields.name.optional(),
    amountMinor: commonFields.amountMinor.optional(),
    category: commonFields.category.optional(),
    notes: z.string().trim().max(2000).optional(),
    scheduleType: z.enum(revenueScheduleTypes).optional(),
    cadence: z.enum(revenueCadences).nullable().optional(),
    paymentAnchor: z.string().refine(isDateOnly).nullable().optional(),
    status: z.enum(revenueStatuses).optional(),
  })
  .refine((value) => Object.keys(value).length > 0)

export type RevenueCategory = (typeof revenueCategories)[number]
export type RevenueStatus = (typeof revenueStatuses)[number]
export type RevenueCreateInput = z.infer<typeof revenueCreateSchema>
export type RevenueUpdateInput = z.infer<typeof revenueUpdateSchema>
