import { z } from "zod"

import { isDateOnly } from "./date"

export const expenseCategories = [
  "housing",
  "food",
  "transport",
  "utilities",
  "health",
  "entertainment",
  "shopping",
  "software",
  "infrastructure",
  "finance",
  "education",
  "travel",
  "other",
] as const
export const expenseStatuses = ["pending", "approved", "declined"] as const

const commonFields = {
  merchant: z.string().trim().min(1).max(100),
  amountMinor: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  transactionDate: z.string().refine(isDateOnly),
  category: z.enum(expenseCategories),
  status: z.enum(expenseStatuses),
  reimbursable: z.boolean(),
  notes: z.string().trim().max(2000).optional().default(""),
}

export const expenseCreateSchema = z.object(commonFields)
export const expenseUpdateSchema = z
  .object({
    merchant: commonFields.merchant.optional(),
    amountMinor: commonFields.amountMinor.optional(),
    transactionDate: commonFields.transactionDate.optional(),
    category: commonFields.category.optional(),
    status: commonFields.status.optional(),
    reimbursable: commonFields.reimbursable.optional(),
    notes: z.string().trim().max(2000).optional(),
    removeReceipt: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0)

export const expenseSettingsSchema = z
  .object({
    monthlyBudgetMinor: z.number().int().positive().nullable(),
    dailyTargetMinor: z.number().int().positive().nullable(),
    budgetPeriod: z.literal("monthly").default("monthly"),
    resetDay: z.number().int().min(1).max(28),
    rolloverEnabled: z.boolean(),
    approachingThreshold: z.number().int().min(1).max(199),
    limitThreshold: z.number().int().min(2).max(200),
  })
  .refine(
    (value) => value.approachingThreshold < value.limitThreshold,
    "Approaching threshold must be lower than the limit threshold."
  )

export type ExpenseCategory = (typeof expenseCategories)[number]
export type ExpenseStatus = (typeof expenseStatuses)[number]
export type ExpenseCreateInput = z.infer<typeof expenseCreateSchema>
export type ExpenseUpdateInput = z.infer<typeof expenseUpdateSchema>
export type ExpenseSettingsInput = z.infer<typeof expenseSettingsSchema>
