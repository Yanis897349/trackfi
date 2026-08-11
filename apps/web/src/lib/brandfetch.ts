export function brandfetchLogoUrl(
  websiteUrl: string | null,
  clientId = import.meta.env.VITE_BRANDFETCH_CLIENT_ID,
  displaySize = 40
) {
  const domain = websiteDomain(websiteUrl)
  if (!domain || !clientId) return null
  const sourceSize = displaySize * 2
  return `https://cdn.brandfetch.io/domain/${encodeURIComponent(domain)}/w/${sourceSize}/h/${sourceSize}/fallback/lettermark/type/icon?c=${encodeURIComponent(clientId)}`
}

function websiteDomain(websiteUrl: string | null) {
  if (!websiteUrl) return null
  try {
    return new URL(websiteUrl).hostname.toLowerCase().replace(/^www\./, "")
  } catch {
    return null
  }
}
