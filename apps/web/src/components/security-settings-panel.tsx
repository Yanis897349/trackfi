import { ShieldCheckIcon } from "lucide-react"

import { Badge } from "@trackfi/ui/components/badge"

import type { CurrentUser } from "../lib/api"
import { m } from "../lib/i18n"
import { SecurityEmailSettings } from "./security-email-settings"
import { SecurityPasswordSettings } from "./security-password-settings"
import { SettingsPanelHeader } from "./settings-panel"

export function SecuritySettingsPanel({ user }: { user: CurrentUser }) {
  return (
    <div className="space-y-5">
      <SettingsPanelHeader
        title={m.settings_security_title()}
        description={m.settings_security_description()}
        action={
          <Badge variant="secondary" className="h-7 gap-1.5 px-2.5">
            <ShieldCheckIcon />
            {user.emailVerified
              ? m.settings_account_protected()
              : m.settings_verification_needed()}
          </Badge>
        }
      />
      <SecurityEmailSettings user={user} />
      <SecurityPasswordSettings />
    </div>
  )
}
