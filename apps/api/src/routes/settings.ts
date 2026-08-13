import type { Hono } from "hono"

import type { AppEnv } from "../types"
import { registerGeneralSettingsRoutes } from "./settings-general"
import { registerNotificationSettingsRoutes } from "./settings-notifications"

export function registerSettingsRoutes(app: Hono<AppEnv>) {
  registerGeneralSettingsRoutes(app)
  registerNotificationSettingsRoutes(app)
}
