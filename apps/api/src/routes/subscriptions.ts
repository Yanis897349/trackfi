import type { Hono } from "hono"

import type { AppEnv } from "../types"
import { registerSubscriptionMutationRoutes } from "./subscription-mutations"
import { registerSubscriptionReadRoutes } from "./subscription-read"

export function registerSubscriptionRoutes(app: Hono<AppEnv>) {
  registerSubscriptionReadRoutes(app)
  registerSubscriptionMutationRoutes(app)
}
