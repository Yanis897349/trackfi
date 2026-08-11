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
const LOGO_CACHE_TTL_SECONDS = 7 * 24 * 60 * 60
const NOT_FOUND_CACHE_TTL_SECONDS = 24 * 60 * 60

type BrandLogoCacheMetadata =
  | {
      status: 200
      contentType: string
      etag?: string
      lastModified?: string
    }
  | { status: 404 }

export function registerBrandLogoRoute(app: Hono<AppEnv>) {
  app.get("/api/brands/logo", async (context) => {
    const user = await requireUser(context)
    if (user instanceof Response) return user

    const parsed = domainSchema.safeParse(context.req.query("domain"))
    if (!parsed.success) {
      return context.json({ error: "invalid_domain" }, 400)
    }
    const cacheKey = `brand-logo:v1:${parsed.data}`
    const cached = await readCachedLogo(
      context.env.BRAND_LOGO_CACHE,
      cacheKey
    ).catch((error) => {
      console.error("Unable to read the brand logo cache", error)
      return null
    })
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
        context.executionCtx.waitUntil(
          context.env.BRAND_LOGO_CACHE.put(cacheKey, "not-found", {
            expirationTtl: NOT_FOUND_CACHE_TTL_SECONDS,
            metadata: { status: 404 } satisfies BrandLogoCacheMetadata,
          }).catch((error) =>
            console.error("Unable to cache the missing brand logo", error)
          )
        )
        return notFound
      }

      context.executionCtx.waitUntil(
        cacheLogo(context.env.BRAND_LOGO_CACHE, cacheKey, logo.clone()).catch(
          (error) => console.error("Unable to cache the brand logo", error)
        )
      )
      return logo
    } catch (error) {
      console.error("Unable to fetch Brandfetch logo", error)
      return context.json({ error: "brandfetch_unavailable" }, 502)
    }
  })
}

async function readCachedLogo(cache: KVNamespace, key: string) {
  const cached = await cache.getWithMetadata<BrandLogoCacheMetadata>(
    key,
    "arrayBuffer"
  )
  if (cached.value === null || cached.metadata === null) return null

  if (cached.metadata.status === 404) {
    return Response.json(
      { error: "logo_not_found" },
      {
        status: 404,
        headers: { "Cache-Control": NOT_FOUND_CACHE_CONTROL },
      }
    )
  }

  const headers = new Headers({
    "Cache-Control": "public, max-age=86400, s-maxage=604800",
    "Content-Security-Policy": "default-src 'none'; sandbox",
    "Content-Type": cached.metadata.contentType,
    "X-Content-Type-Options": "nosniff",
  })
  if (cached.metadata.etag) headers.set("ETag", cached.metadata.etag)
  if (cached.metadata.lastModified) {
    headers.set("Last-Modified", cached.metadata.lastModified)
  }
  return new Response(cached.value, { headers })
}

async function cacheLogo(cache: KVNamespace, key: string, response: Response) {
  const contentType = response.headers.get("Content-Type")
  if (!contentType) return
  const etag = response.headers.get("ETag")
  const lastModified = response.headers.get("Last-Modified")

  const metadata: BrandLogoCacheMetadata = {
    status: 200,
    contentType,
    ...(etag ? { etag } : {}),
    ...(lastModified ? { lastModified } : {}),
  }
  await cache.put(key, await response.arrayBuffer(), {
    expirationTtl: LOGO_CACHE_TTL_SECONDS,
    metadata,
  })
}
