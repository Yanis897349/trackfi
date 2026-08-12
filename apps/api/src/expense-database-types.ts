import type { ExpenseCategory, ExpenseStatus } from "./expense-validation"

export interface ExpenseRow {
  id: string
  user_id: string
  merchant: string
  amount_minor: number
  transaction_date: string
  category: ExpenseCategory
  status: ExpenseStatus
  reimbursable: number
  notes: string | null
  receipt_key: string | null
  receipt_name: string | null
  receipt_content_type: string | null
  receipt_size: number | null
  legacy_expense_id: string | null
  created_at: string
  updated_at: string
}

export interface ExpenseSettingsRow {
  user_id: string
  monthly_budget_minor: number | null
  daily_target_minor: number | null
  budget_period: "monthly"
  reset_day: number
  rollover_enabled: number
  approaching_threshold: number
  limit_threshold: number
  created_at: string
  updated_at: string
}

export interface ReceiptMetadata {
  key: string
  name: string
  contentType: string
  size: number
}
