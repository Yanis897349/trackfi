import { nextRenewalDate, type SubscriptionCadence } from "./subscriptions"
import type {
  SubscriptionCategory,
  SubscriptionCreateInput,
  SubscriptionStatus,
  SubscriptionUpdateInput,
} from "./subscription-validation"

export interface SubscriptionRow {
  id: string
  user_id: string
  name: string
  amount_minor: number
  cadence: SubscriptionCadence
  billing_anchor: string
  category: SubscriptionCategory
  website_url: string | null
  notes: string | null
  status: SubscriptionStatus
  created_at: string
  updated_at: string
}

const selection = `id, user_id, name, amount_minor, cadence, billing_anchor,
  category, website_url, notes, status, created_at, updated_at`

export function listSubscriptionRows(
  database: D1Database,
  userId: string,
  activeOnly = false
) {
  return database
    .prepare(
      `SELECT ${selection} FROM subscriptions WHERE user_id = ?
      ${activeOnly ? "AND status = 'active'" : ""} ORDER BY updated_at DESC`
    )
    .bind(userId)
    .all<SubscriptionRow>()
}

export function findSubscriptionRow(
  database: D1Database,
  userId: string,
  id: string
) {
  return database
    .prepare(
      `SELECT ${selection} FROM subscriptions WHERE id = ? AND user_id = ?`
    )
    .bind(id, userId)
    .first<SubscriptionRow>()
}

export async function createSubscriptionRow(
  database: D1Database,
  userId: string,
  data: SubscriptionCreateInput
) {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  await database
    .prepare(
      `INSERT INTO subscriptions
        (id, user_id, name, amount_minor, cadence, billing_anchor, category,
          website_url, notes, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`
    )
    .bind(
      id,
      userId,
      data.name,
      data.amountMinor,
      data.cadence,
      data.billingAnchor,
      data.category,
      data.websiteUrl || null,
      data.notes || null,
      now,
      now
    )
    .run()
  return (await findSubscriptionRow(database, userId, id))!
}

export async function updateSubscriptionRow(
  database: D1Database,
  existing: SubscriptionRow,
  data: SubscriptionUpdateInput
) {
  const updatedAt = new Date().toISOString()
  await database
    .prepare(
      `UPDATE subscriptions SET name = ?, amount_minor = ?, cadence = ?,
        billing_anchor = ?, category = ?, website_url = ?, notes = ?,
        status = ?, updated_at = ? WHERE id = ? AND user_id = ?`
    )
    .bind(
      data.name ?? existing.name,
      data.amountMinor ?? existing.amount_minor,
      data.cadence ?? existing.cadence,
      data.billingAnchor ?? existing.billing_anchor,
      data.category ?? existing.category,
      data.websiteUrl === undefined
        ? existing.website_url
        : data.websiteUrl || null,
      data.notes === undefined ? existing.notes : data.notes || null,
      data.status ?? existing.status,
      updatedAt,
      existing.id,
      existing.user_id
    )
    .run()
  return (await findSubscriptionRow(database, existing.user_id, existing.id))!
}

export function deleteSubscriptionRow(
  database: D1Database,
  userId: string,
  id: string
) {
  return database
    .prepare("DELETE FROM subscriptions WHERE id = ? AND user_id = ?")
    .bind(id, userId)
    .run()
}

export function serializeSubscription(row: SubscriptionRow, asOf: string) {
  return {
    id: row.id,
    name: row.name,
    amountMinor: row.amount_minor,
    cadence: row.cadence,
    billingAnchor: row.billing_anchor,
    nextRenewalDate: nextRenewalDate(row.billing_anchor, row.cadence, asOf),
    category: row.category,
    websiteUrl: row.website_url,
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
