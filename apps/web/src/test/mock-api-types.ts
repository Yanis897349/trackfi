export interface MockApiOptions {
  deferUrl?: string
  featureFlags?: boolean
  invitation?: { email: string; valid: true } | null
  session: null | { session: { id: string }; user: Record<string, unknown> }
  budgetAlertsEnabled?: boolean
  currency?: string | null
  expenses?: Array<Record<string, unknown>>
  revenueSources?: Array<Record<string, unknown>>
  subscriptions?: Array<Record<string, unknown>>
  waitlistEntries?: boolean
  waitlistMode: boolean
  localeUpdateFails?: boolean
  notifications?: Array<Record<string, unknown>>
}

export interface MockApiRequest {
  init: RequestInit | undefined
  method: string
  url: string
}

export interface MockApiResponse {
  body: unknown
  status?: number
}

export type MockApiHandler = (
  request: MockApiRequest
) => MockApiResponse | undefined
