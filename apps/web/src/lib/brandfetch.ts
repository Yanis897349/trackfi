const BRANDFETCH_LOGO_URL = "https://cdn.brandfetch.io/domain"
const BRANDFETCH_CLIENT_ID =
  import.meta.env.VITE_BRANDFETCH_CLIENT_ID ??
  (import.meta.env.MODE === "test" ? "brandfetch-test-client-id" : "")

export function brandLogoUrl(
  websiteUrl: string | null,
  clientId = BRANDFETCH_CLIENT_ID
) {
  const domain = websiteDomain(websiteUrl)
  if (!domain || !clientId) return null
  return `${BRANDFETCH_LOGO_URL}/${encodeURIComponent(domain)}/w/80/h/80/fallback/404/type/icon?c=${encodeURIComponent(clientId)}`
}

function websiteDomain(websiteUrl: string | null) {
  if (!websiteUrl) return null
  try {
    return new URL(websiteUrl).hostname.toLowerCase().replace(/^www\./, "")
  } catch {
    return null
  }
}
