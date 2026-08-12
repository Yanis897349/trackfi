import { QueryClient } from "@tanstack/react-query"
import {
  createMemoryHistory,
  createRouter,
  type RouterHistory,
} from "@tanstack/react-router"

import { routeTree } from "./routeTree.gen"
import { deLocalizeUrl, localizeUrl } from "./lib/i18n"

export function createAppRouter(history?: RouterHistory) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
      },
    },
  })

  const router = createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: "intent",
    scrollRestoration: true,
    rewrite: {
      input: ({ url }) => deLocalizeUrl(url),
      output: ({ url }) => localizeUrl(url),
    },
    ...(history ? { history } : {}),
  })

  return { queryClient, router }
}

export function createTestRouter(initialPath = "/") {
  return createAppRouter(createMemoryHistory({ initialEntries: [initialPath] }))
}

export type AppRouter = ReturnType<typeof createAppRouter>["router"]

declare module "@tanstack/react-router" {
  interface Register {
    router: AppRouter
  }
}
