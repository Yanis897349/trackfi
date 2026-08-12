import type { Hono } from "hono"

import type { AppEnv } from "../types"
import { registerRevenueSourceListRoute } from "./revenue-source-list-read"
import { registerRevenueSourceMutationRoutes } from "./revenue-source-mutations"
import { registerRevenueSourceSummaryRoute } from "./revenue-source-summary-read"

export function registerRevenueSourceRoutes(app: Hono<AppEnv>) {
  registerRevenueSourceListRoute(app)
  registerRevenueSourceSummaryRoute(app)
  registerRevenueSourceMutationRoutes(app)
}
