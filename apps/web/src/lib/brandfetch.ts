import { API_URL } from "./api"

export function brandLogoUrl(websiteUrl: string | null, apiUrl = API_URL) {
  const domain = websiteDomain(websiteUrl)
  if (!domain) return null
  return `${apiUrl}/api/brands/logo?domain=${encodeURIComponent(domain)}`
}

function websiteDomain(websiteUrl: string | null) {
  if (!websiteUrl) return null
  try {
    return new URL(websiteUrl).hostname.toLowerCase().replace(/^www\./, "")
  } catch {
    return null
  }
}
