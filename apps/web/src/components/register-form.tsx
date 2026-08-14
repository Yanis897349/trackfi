import { Link } from "@tanstack/react-router"

import { m } from "../lib/i18n"
import { AuthShell, FormMessage } from "./auth-shell"
import { RegistrationFields } from "./registration-fields"
import type { RegistrationInvitation } from "./registration-types"
import { useRegistrationForm } from "./use-registration-form"

export function RegisterForm({
  invitation,
}: {
  invitation: RegistrationInvitation
}) {
  const model = useRegistrationForm(invitation)

  return (
    <AuthShell
      eyebrow={model.submitted ? undefined : m.auth_register_eyebrow()}
      title={
        model.submitted ? m.auth_check_inbox_title() : m.auth_register_title()
      }
      description={
        model.submitted
          ? m.auth_check_inbox_description()
          : m.auth_register_description()
      }
    >
      {model.submitted ? (
        <div className="space-y-4 rounded-lg border border-[#dcfce7] bg-[#f0fdf4] p-4 text-center">
          <FormMessage tone="success">
            {m.auth_verification_sent({ email: model.email })}
          </FormMessage>
          <Link to="/login" className="text-sm underline underline-offset-4">
            {m.auth_return_sign_in()}
          </Link>
        </div>
      ) : (
        <RegistrationFields invitation={invitation} model={model} />
      )}
    </AuthShell>
  )
}
