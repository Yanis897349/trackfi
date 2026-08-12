import { renderToReadableStream } from "react-dom/server.edge"
import { createElement } from "react"

import { WaitlistPage } from "../src/components/waitlist-page"
import * as m from "../src/paraglide/messages.js"
import { paraglideMiddleware } from "../src/paraglide/server.js"

interface HtmlElement {
  append(content: string, options?: { html?: boolean }): void
  setAttribute(name: string, value: string): void
  setInnerContent(content: string, options?: { html?: boolean }): void
}

interface HtmlRewriterInstance {
  on(
    selector: string,
    handlers: { element(element: HtmlElement): void }
  ): HtmlRewriterInstance
  transform(response: Response): Response
}

declare const HTMLRewriter: { new (): HtmlRewriterInstance }

interface PagesEnv {
  API_URL: string
  ASSETS: { fetch(request: Request): Promise<Response> }
}

interface PagesContext {
  env: PagesEnv
  params: { locale?: string }
  request: Request
}

export async function onRequest(context: PagesContext) {
  const locale = context.params.locale
  if (locale !== "en" && locale !== "fr") {
    return context.env.ASSETS.fetch(context.request)
  }

  return paraglideMiddleware(context.request, async () => {
    const configResponse = await fetch(`${context.env.API_URL}/api/config`, {
      headers: { Accept: "application/json" },
    })
    if (!configResponse.ok) {
      return new Response(m.error_request_failed({}, { locale }), {
        status: 502,
      })
    }

    const config = (await configResponse.json()) as { waitlistMode: boolean }
    if (!config.waitlistMode) {
      return Response.redirect(
        new URL(`/${locale}/register`, context.request.url),
        302
      )
    }

    const [template, appStream] = await Promise.all([
      context.env.ASSETS.fetch(
        new Request(new URL("/landing.html", context.request.url), {
          headers: context.request.headers,
        })
      ),
      renderToReadableStream(createElement(WaitlistPage)),
    ])
    if (!template.ok) return template

    const appHtml = await new Response(appStream).text()
    const title = `${m.waitlist_title({}, { locale })} · Trackfi`
    const description = m.waitlist_description({}, { locale })
    const origin = new URL(context.request.url).origin

    return new HTMLRewriter()
      .on("html", {
        element(element) {
          element.setAttribute("lang", locale)
        },
      })
      .on("title", {
        element(element) {
          element.setInnerContent(title)
        },
      })
      .on('meta[name="description"]', {
        element(element) {
          element.setAttribute("content", description)
        },
      })
      .on("head", {
        element(element) {
          element.append(
            `<link rel="canonical" href="${origin}/${locale}">` +
              `<link rel="alternate" hreflang="en" href="${origin}/en">` +
              `<link rel="alternate" hreflang="fr" href="${origin}/fr">` +
              `<link rel="alternate" hreflang="x-default" href="${origin}/en">`,
            { html: true }
          )
        },
      })
      .on("#root", {
        element(element) {
          element.setInnerContent(appHtml, { html: true })
        },
      })
      .transform(template)
  })
}
