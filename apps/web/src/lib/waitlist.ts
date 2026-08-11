export type WaitlistStatus = "approved" | "pending" | "registered"

export interface WaitlistEntry {
  approved_at: string | null
  created_at: string
  email: string
  id: string
  invite_delivery_status: "failed" | "not_sent" | "sending" | "sent"
  invite_expires_at: string | null
  invite_sent_at: string | null
  registered_at: string | null
  status: WaitlistStatus
}

export interface WaitlistResponse {
  entries: WaitlistEntry[]
  page: number
  pageSize: number
  total: number
}
