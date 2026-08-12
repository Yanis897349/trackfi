import type { Hono } from "hono"

import type { AppEnv } from "../types"
import { registerExpenseListRoute } from "./expense-list-read"
import { registerExpenseMutationRoutes } from "./expense-mutations"
import { registerExpenseSummaryRoute } from "./expense-summary-read"

export function registerExpenseRoutes(app: Hono<AppEnv>) {
  registerExpenseListRoute(app)
  registerExpenseSummaryRoute(app)
  registerExpenseMutationRoutes(app)
}
