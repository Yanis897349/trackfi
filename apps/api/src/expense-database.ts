import {
  expenseAnnualEquivalentMinor,
  expenseMonthlyEquivalentMinor,
  nextExpenseDate,
  type ExpenseCadence,
} from "./expenses"
import {
  expenseCreateSchema,
  type ExpenseCategory,
  type ExpenseCreateInput,
  type ExpenseStatus,
  type ExpenseUpdateInput,
} from "./expense-validation"

export interface ExpenseRow {
  id: string
  user_id: string
  name: string
  amount_minor: number
  schedule_type: "scheduled" | "variable"
  cadence: ExpenseCadence | null
  expense_anchor: string | null
  category: ExpenseCategory
  notes: string | null
  status: ExpenseStatus
  created_at: string
  updated_at: string
}

const selection = `id, user_id, name, amount_minor, schedule_type, cadence,
  expense_anchor, category, notes, status, created_at, updated_at`

export function listExpenseRows(database: D1Database, userId: string) {
  return database
    .prepare(
      `SELECT ${selection} FROM expenses
      WHERE user_id = ? ORDER BY updated_at DESC`
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
    .prepare(`SELECT ${selection} FROM expenses WHERE id = ? AND user_id = ?`)
    .bind(id, userId)
    .first<ExpenseRow>()
}

export async function createExpenseRow(
  database: D1Database,
  userId: string,
  data: ExpenseCreateInput
) {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  await database
    .prepare(
      `INSERT INTO expenses
      (id, user_id, name, amount_minor, schedule_type, cadence, expense_anchor,
        category, notes, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`
    )
    .bind(
      id,
      userId,
      data.name,
      data.amountMinor,
      data.scheduleType,
      data.cadence,
      data.expenseAnchor,
      data.category,
      data.notes || null,
      now,
      now
    )
    .run()
  return (await findExpenseRow(database, userId, id))!
}

export function resolveExpenseUpdate(
  existing: ExpenseRow,
  data: ExpenseUpdateInput
) {
  const scheduleType = data.scheduleType ?? existing.schedule_type
  return expenseCreateSchema.safeParse({
    name: data.name ?? existing.name,
    amountMinor: data.amountMinor ?? existing.amount_minor,
    category: data.category ?? existing.category,
    notes: data.notes ?? existing.notes ?? "",
    scheduleType,
    cadence:
      scheduleType === "variable"
        ? null
        : data.cadence === undefined
          ? existing.cadence
          : data.cadence,
    expenseAnchor:
      scheduleType === "variable"
        ? null
        : data.expenseAnchor === undefined
          ? existing.expense_anchor
          : data.expenseAnchor,
  })
}

export async function updateExpenseRow(
  database: D1Database,
  existing: ExpenseRow,
  data: ExpenseCreateInput,
  status: ExpenseStatus
) {
  const updatedAt = new Date().toISOString()
  await database
    .prepare(
      `UPDATE expenses SET name = ?, amount_minor = ?, schedule_type = ?,
      cadence = ?, expense_anchor = ?, category = ?, notes = ?, status = ?,
      updated_at = ? WHERE id = ? AND user_id = ?`
    )
    .bind(
      data.name,
      data.amountMinor,
      data.scheduleType,
      data.cadence,
      data.expenseAnchor,
      data.category,
      data.notes || null,
      status,
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
    .prepare("DELETE FROM expenses WHERE id = ? AND user_id = ?")
    .bind(id, userId)
    .run()
}

export function serializeExpense(row: ExpenseRow, asOf: string) {
  const expiredOneTime = row.cadence === "once" && row.expense_anchor! < asOf
  const calculation = {
    amountMinor: expiredOneTime ? 0 : row.amount_minor,
    scheduleType: row.schedule_type,
    cadence: row.cadence,
  }
  return {
    id: row.id,
    name: row.name,
    amountMinor: row.amount_minor,
    scheduleType: row.schedule_type,
    cadence: row.cadence,
    expenseAnchor: row.expense_anchor,
    nextExpenseDate:
      row.schedule_type === "scheduled"
        ? nextExpenseDate(row.expense_anchor!, row.cadence!, asOf)
        : null,
    category: row.category,
    notes: row.notes,
    status: row.status,
    monthlyEquivalentMinor: expenseMonthlyEquivalentMinor(calculation),
    annualEquivalentMinor: expenseAnnualEquivalentMinor(calculation),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
