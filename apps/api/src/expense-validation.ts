import { z } from "zod"

import { isDateOnly } from "./date"
import { expenseCadences } from "./expenses"

export const expenseCategories = [
  "housing",
  "food",
  "transport",
  "utilities",
  "health",
  "entertainment",
  "shopping",
  "software",
  "finance",
  "education",
  "travel",
  "other",
] as const
export const expenseScheduleTypes = ["scheduled", "variable"] as const
export const expenseStatuses = ["active", "paused", "archived"] as const
export const expenseFilters = ["current", ...expenseStatuses, "all"] as const

const commonFields = {
  name: z.string().trim().min(1).max(100),
  amountMinor: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  category: z.enum(expenseCategories),
  notes: z.string().trim().max(2000).optional().default(""),
}

export const expenseCreateSchema = z.discriminatedUnion("scheduleType", [
  z.object({
    ...commonFields,
    scheduleType: z.literal("scheduled"),
    cadence: z.enum(expenseCadences),
    expenseAnchor: z.string().refine(isDateOnly),
  }),
  z.object({
    ...commonFields,
    scheduleType: z.literal("variable"),
    cadence: z.null().optional().default(null),
    expenseAnchor: z.null().optional().default(null),
  }),
])

export const expenseUpdateSchema = z
  .object({
    name: commonFields.name.optional(),
    amountMinor: commonFields.amountMinor.optional(),
    category: commonFields.category.optional(),
    notes: z.string().trim().max(2000).optional(),
    scheduleType: z.enum(expenseScheduleTypes).optional(),
    cadence: z.enum(expenseCadences).nullable().optional(),
    expenseAnchor: z.string().refine(isDateOnly).nullable().optional(),
    status: z.enum(expenseStatuses).optional(),
  })
  .refine((value) => Object.keys(value).length > 0)

export type ExpenseCategory = (typeof expenseCategories)[number]
export type ExpenseStatus = (typeof expenseStatuses)[number]
export type ExpenseCreateInput = z.infer<typeof expenseCreateSchema>
export type ExpenseUpdateInput = z.infer<typeof expenseUpdateSchema>
