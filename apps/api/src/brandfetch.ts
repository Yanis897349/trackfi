import type { Bindings } from "./types"

const BRANDFETCH_LOGO_URL = "https://cdn.brandfetch.io/domain"
const MAX_LOGO_BYTES = 5 * 1024 * 1024
const MAX_REDIRECTS = 3

export async function fetchBrandLogo(
  env: Bindings,
  domain: string
): Promise<Response | null> {
  if (!env.BRANDFETCH_CLIENT_ID) {
    throw new Error("BRANDFETCH_CLIENT_ID is not configured")
  }

  const source = `${BRANDFETCH_LOGO_URL}/${encodeURIComponent(domain)}/w/80/h/80/fallback/404/type/icon?c=${encodeURIComponent(env.BRANDFETCH_CLIENT_ID)}`
  const assetResponse = await fetchTrustedAsset(source)
  if (assetResponse.status === 404) return null
  if (assetResponse.status !== 200) {
    throw new Error(`Brandfetch asset returned ${assetResponse.status}`)
  }

  const contentType = assetResponse.headers.get("Content-Type")
  if (!contentType?.toLowerCase().startsWith("image/")) {
    throw new Error("Brandfetch asset did not return an image")
  }

  const contentLength = assetResponse.headers.get("Content-Length")
  if (
    contentLength !== null &&
    (!/^\d+$/.test(contentLength) || Number(contentLength) > MAX_LOGO_BYTES)
  ) {
    throw new Error("Brandfetch asset exceeded the size limit")
  }

  const body = await readLimitedBody(assetResponse.body)
  const headers = new Headers({
    "Cache-Control": "public, max-age=86400, s-maxage=604800",
    "Content-Security-Policy": "default-src 'none'; sandbox",
    "Content-Type": contentType,
    "X-Content-Type-Options": "nosniff",
  })
  copyHeader(assetResponse.headers, headers, "ETag")
  copyHeader(assetResponse.headers, headers, "Last-Modified")

  return new Response(body, { headers })
}

async function fetchTrustedAsset(source: string) {
  let url = new URL(source)

  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    if (!isTrustedBrandfetchUrl(url)) {
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

function isTrustedBrandfetchUrl(url: URL) {
  return (
    url.protocol === "https:" &&
    (url.hostname === "brandfetch.io" ||
      url.hostname.endsWith(".brandfetch.io"))
  )
}

async function readLimitedBody(body: ReadableStream<Uint8Array> | null) {
  if (!body) throw new Error("Brandfetch asset returned an empty body")

  const reader = body.getReader()
  const chunks: Uint8Array[] = []
  let byteLength = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      byteLength += value.byteLength
      if (byteLength > MAX_LOGO_BYTES) {
        await reader.cancel()
        throw new Error("Brandfetch asset exceeded the size limit")
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }

  const result = new Uint8Array(byteLength)
  let offset = 0
  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.byteLength
  }
  return result
}

function copyHeader(source: Headers, target: Headers, name: string) {
  const value = source.get(name)
  if (value) target.set(name, value)
}
