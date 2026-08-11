import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import { RegisterForm } from "../components/register-form"
import { WaitlistPage } from "../components/waitlist-page"
import { apiFetch, configQueryOptions } from "../lib/api"

const searchSchema = z.object({ invite: z.string().optional() })

export const Route = createFileRoute("/register")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ invite: search.invite }),
  loader: async ({ context, deps }) => {
    const config =
      await context.queryClient.ensureQueryData(configQueryOptions())
    if (!config.waitlistMode) {
      return { gated: false, invite: deps.invite ?? "", email: "", valid: true }
    }
    if (!deps.invite) {
      return { gated: true, invite: "", email: "", valid: false }
    }

    try {
      const invitation = await apiFetch<{ valid: boolean; email: string }>(
        "/api/invitations/validate",
        { method: "POST", body: JSON.stringify({ token: deps.invite }) }
      )
      return {
        gated: true,
        invite: deps.invite,
        email: invitation.email,
        valid: invitation.valid,
      }
    } catch {
      return { gated: true, invite: "", email: "", valid: false }
    }
  },
  component: RegisterRoute,
})

function RegisterRoute() {
  const invitation = Route.useLoaderData()
  if (!invitation.valid) return <WaitlistPage />
  return <RegisterForm invitation={invitation} />
}
