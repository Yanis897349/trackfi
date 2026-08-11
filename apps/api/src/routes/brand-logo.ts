import type { Hono } from "hono"
import { z } from "zod"

import { requireUser } from "../authorization"
import { brandfetchLogoUrl } from "../brandfetch"
import type { AppEnv } from "../types"

const domainSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(253)
  .regex(
    /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/
  )

export function registerBrandLogoRoute(app: Hono<AppEnv>) {
  app.get("/api/brands/logo", async (context) => {
    const user = await requireUser(context)
    if (user instanceof Response) return user

    const parsed = domainSchema.safeParse(context.req.query("domain"))
    if (!parsed.success) {
      return context.json({ error: "invalid_domain" }, 400)
    }
    if (!context.env.BRANDFETCH_CLIENT_ID) {
      return context.json({ error: "brandfetch_not_configured" }, 503)
    }

    // Brandfetch requires the browser to fetch Logo API assets directly so the
    // request carries the application's Referer header. A Worker-side fetch is
    // considered programmatic access and is blocked by Brandfetch.
    return context.redirect(
      brandfetchLogoUrl(parsed.data, context.env.BRANDFETCH_CLIENT_ID),
      302
    )
  })
}
