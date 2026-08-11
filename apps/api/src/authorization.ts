import { createAuth } from "./auth"
import { hasTrustedOrigin } from "./security"
import type { AppContext, AuthUser } from "./types"

async function getSessionUser(context: AppContext): Promise<AuthUser | null> {
  const session = await createAuth(
    context.env,
    context.executionCtx
  ).api.getSession({ headers: context.req.raw.headers })
  if (!session) return null
  return session.user as AuthUser
}

export async function requireAdmin(context: AppContext) {
  const user = await getSessionUser(context)
  if (!user) return context.json({ error: "unauthorized" }, 401)
  if (user.role !== "admin") return context.json({ error: "forbidden" }, 403)
  return user
}

export async function requireAdminMutation(context: AppContext) {
  if (!hasTrustedOrigin(context)) {
    return context.json({ error: "invalid_origin" }, 403)
  }
  return requireAdmin(context)
}
