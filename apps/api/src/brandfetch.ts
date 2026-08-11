import { z } from "zod"

import type { Bindings } from "./types"

const BRANDFETCH_API_URL = "https://api.brandfetch.io/v2/brands/domain"
const MAX_LOGO_BYTES = 5 * 1024 * 1024
const MAX_REDIRECTS = 3

const brandSchema = z.object({
  logos: z
    .array(
      z.object({
        type: z.string().optional(),
        theme: z.string().optional(),
        formats: z.array(
          z.object({
            src: z.string().url(),
            format: z.string().optional(),
          })
        ),
      })
    )
    .default([]),
})

export async function fetchBrandLogo(
  env: Bindings,
  domain: string
): Promise<Response | null> {
  if (!env.BRANDFETCH_API_TOKEN) {
    throw new Error("BRANDFETCH_API_TOKEN is not configured")
  }

  const brandResponse = await fetch(
    `${BRANDFETCH_API_URL}/${encodeURIComponent(domain)}`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${env.BRANDFETCH_API_TOKEN}`,
      },
    }
  )
  if (brandResponse.status === 404) return null
  if (!brandResponse.ok) {
    throw new Error(`Brandfetch API returned ${brandResponse.status}`)
  }

  const parsed = brandSchema.safeParse(
    await brandResponse.json().catch(() => null)
  )
  if (!parsed.success) {
    throw new Error("Brandfetch API returned an invalid response")
  }

  const source = selectLogoSource(parsed.data.logos)
  if (!source) return null

  const assetResponse = await fetchTrustedAsset(source)
  if (!assetResponse.ok) {
    if (assetResponse.status === 404) return null
    throw new Error(`Brandfetch asset returned ${assetResponse.status}`)
  }

  const contentType = assetResponse.headers.get("Content-Type")
  if (!contentType?.toLowerCase().startsWith("image/")) {
    throw new Error("Brandfetch asset did not return an image")
  }

  const contentLength = Number(assetResponse.headers.get("Content-Length"))
  if (Number.isFinite(contentLength) && contentLength > MAX_LOGO_BYTES) {
    throw new Error("Brandfetch asset exceeded the size limit")
  }

  const headers = new Headers({
    "Cache-Control": "public, max-age=86400, s-maxage=604800",
    "Content-Security-Policy": "default-src 'none'; sandbox",
    "Content-Type": contentType,
    "X-Content-Type-Options": "nosniff",
  })
  copyHeader(assetResponse.headers, headers, "Content-Length")
  copyHeader(assetResponse.headers, headers, "ETag")
  copyHeader(assetResponse.headers, headers, "Last-Modified")

  return new Response(assetResponse.body, { headers })
}

function selectLogoSource(logos: z.infer<typeof brandSchema>["logos"]) {
  return logos
    .flatMap((logo) =>
      logo.formats.map((format) => ({
        ...format,
        score:
          logoTypeScore(logo.type) +
          logoThemeScore(logo.theme) +
          logoFormatScore(format.format, format.src),
      }))
    )
    .filter((format) => isTrustedBrandfetchUrl(format.src))
    .sort((left, right) => right.score - left.score)[0]?.src
}

function logoTypeScore(type: string | undefined) {
  if (type === "icon") return 100
  if (type === "symbol") return 50
  if (type === "logo") return 25
  return 0
}

function logoThemeScore(theme: string | undefined) {
  return theme === "light" ? 10 : 0
}

function logoFormatScore(format: string | undefined, source: string) {
  const normalized = (format ?? source.split(".").pop() ?? "").toLowerCase()
  if (normalized === "png") return 4
  if (normalized === "webp") return 3
  if (normalized === "jpg" || normalized === "jpeg") return 2
  if (normalized === "svg") return 1
  return 0
}

async function fetchTrustedAsset(source: string) {
  let url = new URL(source)

  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    if (!isTrustedBrandfetchUrl(url.toString())) {
      throw new Error("Brandfetch returned an untrusted asset URL")
    }

    const response = await fetch(url, {
      headers: { Accept: "image/avif,image/webp,image/png,image/*" },
      redirect: "manual",
    })
    if (response.status < 300 || response.status >= 400) return response

    const location = response.headers.get("Location")
    if (!location || redirect === MAX_REDIRECTS) {
      throw new Error("Brandfetch asset returned an invalid redirect")
    }
    url = new URL(location, url)
  }

  throw new Error("Brandfetch asset exceeded the redirect limit")
}

function isTrustedBrandfetchUrl(source: string) {
  try {
    const url = new URL(source)
    return (
      url.protocol === "https:" &&
      (url.hostname === "brandfetch.io" ||
        url.hostname.endsWith(".brandfetch.io"))
    )
  } catch {
    return false
  }
}

function copyHeader(source: Headers, target: Headers, name: string) {
  const value = source.get(name)
  if (value) target.set(name, value)
}
