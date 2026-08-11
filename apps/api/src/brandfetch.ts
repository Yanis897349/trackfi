const BRANDFETCH_LOGO_URL = "https://cdn.brandfetch.io/domain"

export function brandfetchLogoUrl(domain: string, clientId: string) {
  return `${BRANDFETCH_LOGO_URL}/${encodeURIComponent(domain)}/w/80/h/80/fallback/404/type/icon?c=${encodeURIComponent(clientId)}`
}
