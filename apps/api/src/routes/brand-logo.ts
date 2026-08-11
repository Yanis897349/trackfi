import type { Hono } from "hono"
import { z } from "zod"

import { requireUser } from "../authorization"
import { fetchBrandLogo } from "../brandfetch"
import type { AppEnv } from "../types"

const domainSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(253)
  .regex(
    /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/
  )

const NOT_FOUND_CACHE_CONTROL = "public, max-age=3600, s-maxage=86400"

export function registerBrandLogoRoute(app: Hono<AppEnv>) {
  app.get("/api/brands/logo", async (context) => {
    const user = await requireUser(context)
    if (user instanceof Response) return user

    const parsed = domainSchema.safeParse(context.req.query("domain"))
    if (!parsed.success) {
      return context.json({ error: "invalid_domain" }, 400)
    }
    const cacheKey = new Request(
      `${new URL(context.req.url).origin}/api/brands/logo?domain=${encodeURIComponent(parsed.data)}`
    )
    const cache = await caches.open("trackfi-brand-logos")
    const cached = await cache.match(cacheKey)
    if (cached) return cached

    if (!context.env.BRANDFETCH_CLIENT_ID) {
      return context.json({ error: "brandfetch_not_configured" }, 503)
    }

    const rateLimit = await context.env.BRAND_LOGO_RATE_LIMITER.limit({
      key: user.id,
    })
    if (!rateLimit.success) {
      return context.json({ error: "rate_limited" }, 429)
    }

    try {
      const logo = await fetchBrandLogo(context.env, parsed.data)
      if (!logo) {
        const notFound = Response.json(
          { error: "logo_not_found" },
          {
            status: 404,
            headers: { "Cache-Control": NOT_FOUND_CACHE_CONTROL },
          }
        )
        context.executionCtx.waitUntil(cache.put(cacheKey, notFound.clone()))
        return notFound
      }

      context.executionCtx.waitUntil(cache.put(cacheKey, logo.clone()))
      return logo
    } catch (error) {
      console.error("Unable to fetch Brandfetch logo", error)
      return context.json({ error: "brandfetch_unavailable" }, 502)
    }
  })
}
