import type {
  ExpenseCreateInput,
  ExpenseUpdateInput,
} from "./expense-validation"
import type { ExpenseRow, ReceiptMetadata } from "./expense-database-types"

const selection = `id, user_id, merchant, amount_minor, transaction_date,
  category, status, reimbursable, notes, receipt_key, receipt_name,
  receipt_content_type, receipt_size, legacy_expense_id, created_at, updated_at`

export function listExpenseRows(database: D1Database, userId: string) {
  return database
    .prepare(
      `SELECT ${selection} FROM expense_transactions
      WHERE user_id = ? ORDER BY transaction_date DESC, created_at DESC`
    )
    .bind(userId)
    .all<ExpenseRow>()
}

export function findExpenseRow(
  database: D1Database,
  userId: string,
  id: string
) {
  return database
    .prepare(
      `SELECT ${selection} FROM expense_transactions WHERE id = ? AND user_id = ?`
    )
    .bind(id, userId)
    .first<ExpenseRow>()
}

export async function createExpenseRow(
  database: D1Database,
  userId: string,
  data: ExpenseCreateInput,
  receipt: ReceiptMetadata | null
) {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  await database
    .prepare(
      `INSERT INTO expense_transactions
      (id, user_id, merchant, amount_minor, transaction_date, category, status,
        reimbursable, notes, receipt_key, receipt_name, receipt_content_type,
        receipt_size, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      userId,
      data.merchant,
      data.amountMinor,
      data.transactionDate,
      data.category,
      data.status,
      data.reimbursable ? 1 : 0,
      data.notes || null,
      receipt?.key ?? null,
      receipt?.name ?? null,
      receipt?.contentType ?? null,
      receipt?.size ?? null,
      now,
      now
    )
    .run()
  return (await findExpenseRow(database, userId, id))!
}

export async function updateExpenseRow(
  database: D1Database,
  existing: ExpenseRow,
  data: ExpenseUpdateInput,
  receipt: ReceiptMetadata | null | undefined
) {
  const nextReceipt =
    receipt === undefined ? existingReceipt(existing) : receipt
  const updatedAt = new Date().toISOString()
  await database
    .prepare(
      `UPDATE expense_transactions SET merchant = ?, amount_minor = ?,
      transaction_date = ?, category = ?, status = ?, reimbursable = ?, notes = ?,
      receipt_key = ?, receipt_name = ?, receipt_content_type = ?, receipt_size = ?,
      updated_at = ? WHERE id = ? AND user_id = ?`
    )
    .bind(
      data.merchant ?? existing.merchant,
      data.amountMinor ?? existing.amount_minor,
      data.transactionDate ?? existing.transaction_date,
      data.category ?? existing.category,
      data.status ?? existing.status,
      (data.reimbursable ?? Boolean(existing.reimbursable)) ? 1 : 0,
      data.notes === undefined ? existing.notes : data.notes || null,
      nextReceipt?.key ?? null,
      nextReceipt?.name ?? null,
      nextReceipt?.contentType ?? null,
      nextReceipt?.size ?? null,
      updatedAt,
      existing.id,
      existing.user_id
    )
    .run()
  return (await findExpenseRow(database, existing.user_id, existing.id))!
}

export function deleteExpenseRow(
  database: D1Database,
  userId: string,
  id: string
) {
  return database
    .prepare("DELETE FROM expense_transactions WHERE id = ? AND user_id = ?")
    .bind(id, userId)
    .run()
}

export function serializeExpense(row: ExpenseRow) {
  return {
    id: row.id,
    merchant: row.merchant,
    amountMinor: row.amount_minor,
    transactionDate: row.transaction_date,
    category: row.category,
    status: row.status,
    reimbursable: Boolean(row.reimbursable),
    notes: row.notes,
    receipt: row.receipt_key
      ? {
          name: row.receipt_name!,
          contentType: row.receipt_content_type!,
          size: row.receipt_size!,
          url: `/api/expenses/${row.id}/receipt`,
        }
      : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function existingReceipt(row: ExpenseRow): ReceiptMetadata | null {
  return row.receipt_key
    ? {
        key: row.receipt_key,
        name: row.receipt_name!,
        contentType: row.receipt_content_type!,
        size: row.receipt_size!,
      }
    : null
}
