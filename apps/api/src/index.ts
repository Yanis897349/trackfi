import { Hono } from "hono"
import { cors } from "hono/cors"

import { getAppOrigin } from "./config"
import { registerAdminFeatureFlagRoutes } from "./routes/admin-feature-flags"
import { registerAdminWaitlistRoutes } from "./routes/admin-waitlist"
import { registerAuthRoutes } from "./routes/auth"
import { registerBrandLogoRoute } from "./routes/brand-logo"
import { registerPublicRoutes } from "./routes/public"
import { registerSettingsRoutes } from "./routes/settings"
import { registerSubscriptionRoutes } from "./routes/subscriptions"
import type { AppEnv } from "./types"

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
registerBrandLogoRoute(app)
registerAdminWaitlistRoutes(app)
registerAdminFeatureFlagRoutes(app)
registerSettingsRoutes(app)
registerSubscriptionRoutes(app)

app.notFound((context) => context.json({ error: "not_found" }, 404))

export { app }
export default app
