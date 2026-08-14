import { m } from "../lib/i18n"
import { AuthEmailSent } from "./auth-email-sent"
import { AuthShell } from "./auth-shell"
import { RegistrationFields } from "./registration-fields"
import type { RegistrationInvitation } from "./registration-types"
import { useRegistrationForm } from "./use-registration-form"

export function RegisterForm({
  invitation,
}: {
  invitation: RegistrationInvitation
}) {
  const model = useRegistrationForm(invitation)

  if (model.submitted) {
    return (
      <AuthEmailSent
        email={model.email}
        description={m.auth_check_inbox_description()}
        statusTitle={m.auth_verification_email_sent()}
        secondaryActionLabel={
          model.resending
            ? m.auth_resending_verification()
            : m.auth_resend_verification()
        }
        secondaryActionPending={model.resending}
        onSecondaryAction={model.resendVerification}
        onChangeEmail={invitation.gated ? undefined : model.changeEmail}
        feedback={model.resendFeedback}
        feedbackTone={model.resendFeedbackTone}
      />
    )
  }

  return (
    <AuthShell
      eyebrow={m.auth_register_eyebrow()}
      title={m.auth_register_title()}
      description={m.auth_register_description()}
    >
      <RegistrationFields invitation={invitation} model={model} />
    </AuthShell>
  )
}
