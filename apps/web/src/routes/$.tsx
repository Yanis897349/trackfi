import { createFileRoute, Navigate } from "@tanstack/react-router"

import { WaitlistPage } from "../components/waitlist-page"
import { configQueryOptions, getSession } from "../lib/api"

export const Route = createFileRoute("/$")({
  loader: async ({ context }) => {
    const [config, session] = await Promise.all([
      context.queryClient.ensureQueryData(configQueryOptions()),
      getSession(),
    ])
    return { config, session }
  },
  component: CatchAllRoute,
})

function CatchAllRoute() {
  const { config, session } = Route.useLoaderData()
  if (session) return <Navigate to="/dashboard" replace />
  if (!config.waitlistMode) return <Navigate to="/login" replace />
  return <WaitlistPage />
}
