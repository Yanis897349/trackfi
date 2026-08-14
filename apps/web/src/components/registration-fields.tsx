import { Link } from "@tanstack/react-router"

import { Button } from "@trackfi/ui/components/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@trackfi/ui/components/field"
import { Input } from "@trackfi/ui/components/input"

import { m } from "../lib/i18n"
import { authInputClassName, authPrimaryButtonClassName } from "./auth-shell"
import type { RegistrationInvitation } from "./registration-types"
import { TurnstileWidget } from "./turnstile-widget"
import type { RegistrationFormModel } from "./use-registration-form"

export function RegistrationFields({
  invitation,
  model,
}: {
  invitation: RegistrationInvitation
  model: RegistrationFormModel
}) {
  return (
    <form onSubmit={model.handleSubmit}>
      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel htmlFor="register-name">{m.auth_full_name()}</FieldLabel>
          <Input
            id="register-name"
            autoComplete="name"
            placeholder={m.auth_name_placeholder()}
            required
            maxLength={100}
            value={model.name}
            className={authInputClassName}
            onChange={(event) => model.setName(event.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="register-email">{m.auth_email()}</FieldLabel>
          <Input
            id="register-email"
            type="email"
            autoComplete="email"
            placeholder={m.auth_email_placeholder()}
            required
            readOnly={invitation.gated}
            value={model.email}
            className={authInputClassName}
            onChange={(event) => model.setEmail(event.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="register-password">
            {m.auth_password()}
          </FieldLabel>
          <Input
            id="register-password"
            type="password"
            autoComplete="new-password"
            placeholder={m.auth_password_placeholder()}
            required
            minLength={8}
            maxLength={128}
            value={model.password}
            className={authInputClassName}
            onChange={(event) => model.setPassword(event.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="register-confirmation">
            {m.auth_confirm_password()}
          </FieldLabel>
          <Input
            id="register-confirmation"
            type="password"
            autoComplete="new-password"
            placeholder={m.auth_confirmation_placeholder()}
            required
            minLength={8}
            maxLength={128}
            value={model.confirmation}
            className={authInputClassName}
            onChange={(event) => model.setConfirmation(event.target.value)}
          />
        </Field>
        {model.error && <FieldError>{model.error}</FieldError>}
        <div className="flex justify-center">
          <TurnstileWidget
            onTokenChange={model.handleToken}
            resetKey={model.turnstileResetKey}
          />
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={model.submitting}
          className={authPrimaryButtonClassName}
        >
          {model.submitting
            ? m.auth_creating_account()
            : m.auth_create_account()}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          {m.auth_already_access()}{" "}
          <Link to="/login" className="text-foreground hover:underline">
            {m.auth_sign_in()}
          </Link>
        </p>
      </FieldGroup>
    </form>
  )
}
