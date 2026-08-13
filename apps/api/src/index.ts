import { Hono } from "hono"
import { cors } from "hono/cors"

import { getAppOrigin } from "./config"
import { registerAdminFeatureFlagRoutes } from "./routes/admin-feature-flags"
import { registerAdminWaitlistRoutes } from "./routes/admin-waitlist"
import { registerAuthRoutes } from "./routes/auth"
import { registerDashboardCalendarRoute } from "./routes/dashboard-calendar"
import { registerDashboardOverviewRoute } from "./routes/dashboard-overview"
import { registerExpenseRoutes } from "./routes/expenses"
import { registerNotificationRoutes } from "./routes/notifications"
import { registerPublicRoutes } from "./routes/public"
import { registerRevenueSourceRoutes } from "./routes/revenue-sources"
import { registerSettingsRoutes } from "./routes/settings"
import { registerSubscriptionRoutes } from "./routes/subscriptions"
import type { AppEnv } from "./types"
import type { Bindings } from "./types"
import type { NotificationDeliveryMessage } from "./notification-types"
import {
  processNotificationDeliveryBatch,
  runNotificationMaintenance,
} from "./notification-delivery"

const app = new Hono<AppEnv>()

app.use(
  "/api/*",
  cors({
    origin: (origin, context) =>
      origin === getAppOrigin(context.env) ? origin : null,
    allowHeaders: ["Content-Type", "X-Invite-Token", "X-Turnstile-Token"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
    maxAge: 600,
  })
)

registerPublicRoutes(app)
registerAuthRoutes(app)
registerDashboardCalendarRoute(app)
registerDashboardOverviewRoute(app)
registerAdminWaitlistRoutes(app)
registerAdminFeatureFlagRoutes(app)
registerSettingsRoutes(app)
registerSubscriptionRoutes(app)
registerExpenseRoutes(app)
registerNotificationRoutes(app)
registerRevenueSourceRoutes(app)

app.notFound((context) => context.json({ error: "not_found" }, 404))

export { app }

const worker: ExportedHandler<Bindings, NotificationDeliveryMessage> = {
  fetch: (request, env, executionContext) =>
    app.fetch(request, env, executionContext),
  scheduled: (_controller, env, executionContext) => {
    executionContext.waitUntil(runNotificationMaintenance(env))
  },
  queue: (batch, env) => processNotificationDeliveryBatch(env, batch),
}

export default worker
