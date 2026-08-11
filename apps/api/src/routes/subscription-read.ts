import type { Hono } from "hono"

import type { AppEnv } from "../types"
import { registerSubscriptionCalendarRoute } from "./subscription-calendar-read"
import { registerSubscriptionListRoute } from "./subscription-list-read"
import { registerSubscriptionSummaryRoute } from "./subscription-summary-read"

export function registerSubscriptionReadRoutes(app: Hono<AppEnv>) {
  registerSubscriptionListRoute(app)
  registerSubscriptionSummaryRoute(app)
  registerSubscriptionCalendarRoute(app)
}
