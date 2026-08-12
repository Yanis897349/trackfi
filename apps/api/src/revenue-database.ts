import {
  nextRevenuePaymentDate,
  revenueAnnualEquivalentMinor,
  revenueMonthlyEquivalentMinor,
  type RevenueCadence,
} from "./revenue"
import {
  revenueCreateSchema,
  type RevenueCategory,
  type RevenueCreateInput,
  type RevenueStatus,
  type RevenueUpdateInput,
} from "./revenue-validation"

export interface RevenueSourceRow {
  id: string
  user_id: string
  name: string
  amount_minor: number
  schedule_type: "scheduled" | "variable"
  cadence: RevenueCadence | null
  payment_anchor: string | null
  category: RevenueCategory
  notes: string | null
  status: RevenueStatus
  created_at: string
  updated_at: string
}

const selection = `id, user_id, name, amount_minor, schedule_type, cadence,
  payment_anchor, category, notes, status, created_at, updated_at`

export function listRevenueSourceRows(database: D1Database, userId: string) {
  return database
    .prepare(
      `SELECT ${selection} FROM revenue_sources
      WHERE user_id = ? ORDER BY updated_at DESC`
    )
    .bind(userId)
    .all<RevenueSourceRow>()
}

export function findRevenueSourceRow(
  database: D1Database,
  userId: string,
  id: string
) {
  return database
    .prepare(
      `SELECT ${selection} FROM revenue_sources WHERE id = ? AND user_id = ?`
    )
    .bind(id, userId)
    .first<RevenueSourceRow>()
}

export async function createRevenueSourceRow(
  database: D1Database,
  userId: string,
  data: RevenueCreateInput
) {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  await database
    .prepare(
      `INSERT INTO revenue_sources
      (id, user_id, name, amount_minor, schedule_type, cadence, payment_anchor,
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
      data.paymentAnchor,
      data.category,
      data.notes || null,
      now,
      now
    )
    .run()
  return (await findRevenueSourceRow(database, userId, id))!
}

export function resolveRevenueSourceUpdate(
  existing: RevenueSourceRow,
  data: RevenueUpdateInput
) {
  const scheduleType = data.scheduleType ?? existing.schedule_type
  const candidate = {
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
    paymentAnchor:
      scheduleType === "variable"
        ? null
        : data.paymentAnchor === undefined
          ? existing.payment_anchor
          : data.paymentAnchor,
  }
  return revenueCreateSchema.safeParse(candidate)
}

export async function updateRevenueSourceRow(
  database: D1Database,
  existing: RevenueSourceRow,
  data: RevenueCreateInput,
  status: RevenueStatus
) {
  const updatedAt = new Date().toISOString()
  await database
    .prepare(
      `UPDATE revenue_sources SET name = ?, amount_minor = ?,
      schedule_type = ?, cadence = ?, payment_anchor = ?, category = ?,
      notes = ?, status = ?, updated_at = ? WHERE id = ? AND user_id = ?`
    )
    .bind(
      data.name,
      data.amountMinor,
      data.scheduleType,
      data.cadence,
      data.paymentAnchor,
      data.category,
      data.notes || null,
      status,
      updatedAt,
      existing.id,
      existing.user_id
    )
    .run()
  return (await findRevenueSourceRow(database, existing.user_id, existing.id))!
}

export function deleteRevenueSourceRow(
  database: D1Database,
  userId: string,
  id: string
) {
  return database
    .prepare("DELETE FROM revenue_sources WHERE id = ? AND user_id = ?")
    .bind(id, userId)
    .run()
}

export function serializeRevenueSource(row: RevenueSourceRow, asOf: string) {
  const expiredOneTime = row.cadence === "once" && row.payment_anchor! < asOf
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
    paymentAnchor: row.payment_anchor,
    nextPaymentDate:
      row.schedule_type === "scheduled"
        ? nextRevenuePaymentDate(row.payment_anchor!, row.cadence!, asOf)
        : null,
    category: row.category,
    notes: row.notes,
    status: row.status,
    monthlyEquivalentMinor: revenueMonthlyEquivalentMinor(calculation),
    annualEquivalentMinor: revenueAnnualEquivalentMinor(calculation),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
