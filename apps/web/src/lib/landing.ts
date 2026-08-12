import { getSession, type SessionData } from "./api"
import { localizeHref } from "./i18n"

interface LandingBootstrapOptions {
  loadSession?: () => Promise<SessionData | null>
  onPublic(): void
  redirect?: (href: string) => void
}

export async function bootstrapLocalizedLanding({
  loadSession = getSession,
  onPublic,
  redirect = (href) => window.location.replace(href),
}: LandingBootstrapOptions) {
  const session = await loadSession().catch(() => null)
  if (session) {
    redirect(localizeHref("/dashboard"))
    return
  }

  onPublic()
}
