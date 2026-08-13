import { useEffect } from "react"
import {
  createRootRouteWithContext,
  Outlet,
  redirect,
  useLocation,
} from "@tanstack/react-router"
import type { QueryClient } from "@tanstack/react-query"
import { TooltipProvider } from "@trackfi/ui/components/tooltip"
import { UiTextProvider } from "@trackfi/ui/components/ui-text"

import { extractLocaleFromUrl, getLocale, m, shouldRedirect } from "../lib/i18n"
import { getSession } from "../lib/api"

interface RouterContext {
  queryClient: QueryClient
}

function metadataForPath(pathname: string) {
  if (pathname === "/") {
    return {
      description: m.waitlist_description(),
      indexable: true,
      title: m.waitlist_title(),
    }
  }
  if (pathname === "/login") {
    return {
      description: m.auth_login_description(),
      title: m.auth_login_title(),
    }
  }
  if (pathname === "/register") {
    return {
      description: m.auth_register_description(),
      title: m.auth_register_title(),
    }
  }
  if (pathname === "/forgot-password") {
    return {
      description: m.auth_reset_request_description(),
      title: m.auth_reset_request_title(),
    }
  }
  if (pathname === "/reset-password") {
    return {
      description: m.auth_reset_description(),
      title: m.auth_reset_title(),
    }
  }
  if (pathname === "/dashboard/subscriptions/calendar") {
    return { description: m.calendar_description(), title: m.calendar_title() }
  }
  if (pathname === "/dashboard/calendar") {
    return {
      description: m.dashboard_calendar_description(),
      title: m.dashboard_calendar_title(),
    }
  }
  if (pathname === "/dashboard/subscriptions") {
    return {
      description: m.module_subscriptions_description(),
      title: m.nav_subscriptions(),
    }
  }
  if (pathname === "/dashboard/revenue") {
    return {
      description: m.module_revenue_description(),
      title: m.nav_revenue(),
    }
  }
  if (pathname === "/dashboard/expenses") {
    return {
      description: m.module_expenses_description(),
      title: m.nav_expenses(),
    }
  }
  if (pathname === "/dashboard/settings") {
    return { description: m.settings_description(), title: m.settings_title() }
  }
  if (pathname === "/dashboard/feature-flags") {
    return {
      description: m.admin_feature_flags_description(),
      title: m.admin_feature_flags_title(),
    }
  }
  if (pathname === "/dashboard/waitlist") {
    return {
      description: m.admin_waitlist_description(),
      title: m.nav_waitlist(),
    }
  }
  if (pathname.startsWith("/dashboard")) {
    return { description: m.dashboard_intro(), title: m.dashboard_overview() }
  }
  return { description: m.not_found_description(), title: m.not_found_title() }
}

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async () => {
    if (typeof window === "undefined") return
    if (import.meta.env.MODE === "test") return
    const explicitLocale = extractLocaleFromUrl(window.location.href)
    const accountLocale = explicitLocale
      ? undefined
      : (await getSession())?.user.locale
    const decision = await shouldRedirect({
      url: window.location.href,
      ...(accountLocale ? { locale: accountLocale } : {}),
    })
    if (decision.shouldRedirect && decision.redirectUrl) {
      throw redirect({ href: decision.redirectUrl.href })
    }
  },
  component: RootLayout,
})

function RootLayout() {
  const location = useLocation()

  useEffect(() => {
    const locale = getLocale()
    document.documentElement.lang = locale

    const metadata = metadataForPath(location.pathname)
    document.title = `${metadata.title} · Trackfi`

    let descriptionMeta = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]'
    )
    if (!descriptionMeta) {
      descriptionMeta = document.createElement("meta")
      descriptionMeta.name = "description"
      document.head.append(descriptionMeta)
    }
    descriptionMeta.content = metadata.description

    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]')
    if (!robots) {
      robots = document.createElement("meta")
      robots.name = "robots"
      document.head.append(robots)
    }
    robots.content = metadata.indexable ? "index,follow" : "noindex,nofollow"

    for (const selector of [
      'link[rel="canonical"]',
      'link[rel="alternate"][hreflang]',
    ]) {
      document.head.querySelectorAll(selector).forEach((node) => node.remove())
    }

    if (metadata.indexable) {
      const canonical = document.createElement("link")
      canonical.rel = "canonical"
      canonical.href = `${window.location.origin}/${locale}`
      document.head.append(canonical)

      for (const alternateLocale of ["en", "fr"] as const) {
        const alternate = document.createElement("link")
        alternate.rel = "alternate"
        alternate.hreflang = alternateLocale
        alternate.href = `${window.location.origin}/${alternateLocale}`
        document.head.append(alternate)
      }

      const defaultAlternate = document.createElement("link")
      defaultAlternate.rel = "alternate"
      defaultAlternate.hreflang = "x-default"
      defaultAlternate.href = `${window.location.origin}/en`
      document.head.append(defaultAlternate)
    }
  }, [location.href, location.pathname])

  return (
    <UiTextProvider
      value={{
        close: m.common_close(),
        sidebarDescription: m.nav_sidebar_description(),
        sidebarTitle: m.nav_sidebar_title(),
        toggleSidebar: m.nav_toggle_sidebar(),
      }}
    >
      <TooltipProvider>
        <Outlet />
      </TooltipProvider>
    </UiTextProvider>
  )
}
