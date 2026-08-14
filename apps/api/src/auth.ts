import { betterAuth } from "better-auth"
import { normalizeLocale } from "@trackfi/localization"

import {
  getAppOrigin,
  getAuthBaseUrl,
  getAuthSecret,
  isAdminEmail,
} from "./config"
import { sendPasswordReset, sendVerificationEmail } from "./email"
import type { Bindings } from "./types"

export function createAuth(
  env: Bindings,
  executionContext?: { waitUntil(promise: Promise<unknown>): void }
) {
  const authBaseUrl = getAuthBaseUrl(env)
  const isLocal = authBaseUrl.includes("localhost")

  return betterAuth({
    appName: "Trackfi",
    basePath: "/api/auth",
    baseURL: authBaseUrl,
    database: env.DB,
    secret: getAuthSecret(env),
    trustedOrigins: [getAppOrigin(env)],
    emailAndPassword: {
      enabled: true,
      autoSignIn: false,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      requireEmailVerification: true,
      resetPasswordTokenExpiresIn: 30 * 60,
      sendResetPassword: ({ user, url }) => {
        const promise = sendPasswordReset(
          env,
          user.email,
          url,
          normalizeLocale((user as { locale?: unknown }).locale)
        )
        if (executionContext) {
          executionContext.waitUntil(promise)
          return Promise.resolve()
        }
        return promise
      },
    },
    emailVerification: {
      expiresIn: 30 * 60,
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: false,
      sendVerificationEmail: ({ user, url }) => {
        const promise = sendVerificationEmail(
          env,
          user.email,
          url,
          normalizeLocale((user as { locale?: unknown }).locale)
        )
        if (executionContext) {
          executionContext.waitUntil(promise)
          return Promise.resolve()
        }
        return promise
      },
    },
    user: {
      changeEmail: {
        enabled: true,
      },
      additionalFields: {
        role: {
          type: ["user", "admin"],
          required: true,
          defaultValue: "user",
          input: false,
        },
        locale: {
          type: ["en", "fr"],
          required: true,
          defaultValue: "en",
          input: true,
        },
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => ({
            data: {
              ...user,
              email: user.email.trim().toLowerCase(),
              locale: normalizeLocale(user.locale),
              role: isAdminEmail(env, user.email) ? "admin" : "user",
            },
          }),
        },
      },
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 100,
    },
    advanced: {
      ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] },
      defaultCookieAttributes: {
        httpOnly: true,
        secure: !isLocal,
        sameSite: isLocal ? "lax" : "none",
        ...(isLocal ? {} : { partitioned: true }),
      },
    },
  })
}
