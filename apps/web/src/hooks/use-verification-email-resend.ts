import { useState } from "react"

import { authClient } from "../lib/api"
import { localizeHref, m } from "../lib/i18n"

export function useVerificationEmailResend(email: string) {
  const [isPending, setIsPending] = useState(false)
  const [feedback, setFeedback] = useState("")
  const [feedbackTone, setFeedbackTone] = useState<"error" | "success">(
    "success"
  )

  async function resend() {
    setIsPending(true)
    setFeedback("")
    try {
      const result = await authClient.sendVerificationEmail({
        email,
        callbackURL: new URL(localizeHref("/login"), window.location.origin)
          .href,
      })
      if (result.error) throw new Error("resend_failed")
      setFeedbackTone("success")
      setFeedback(m.auth_verification_resent())
    } catch {
      setFeedbackTone("error")
      setFeedback(m.auth_verification_resend_failed())
    } finally {
      setIsPending(false)
    }
  }

  function reset() {
    setFeedback("")
    setFeedbackTone("success")
  }

  return { feedback, feedbackTone, isPending, resend, reset }
}
