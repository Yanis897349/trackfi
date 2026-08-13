import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { BellIcon, Settings2Icon, ShieldCheckIcon } from "lucide-react"
import { z } from "zod"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@trackfi/ui/components/tabs"
import { useIsMobile } from "@trackfi/ui/hooks/use-mobile"

import { GeneralSettingsPanel } from "../components/general-settings-panel"
import { ModuleError } from "../components/module-layout"
import { NotificationSettingsPanel } from "../components/notification-settings-panel"
import { SecuritySettingsPanel } from "../components/security-settings-panel"
import { SettingsLoadingState } from "../components/settings-loading-state"
import { m } from "../lib/i18n"
import {
  notificationSettingsQueryOptions,
  settingsQueryOptions,
} from "../lib/settings"

const settingsTabSchema = z.enum(["general", "notifications", "security"])
type SettingsTab = z.infer<typeof settingsTabSchema>

export const Route = createFileRoute("/dashboard/settings")({
  validateSearch: z.object({
    tab: settingsTabSchema.catch("general").default("general"),
  }),
  component: SettingsRoute,
})

function SettingsRoute() {
  const { currentUser } = Route.useRouteContext()
  const { tab } = Route.useSearch()
  const navigate = Route.useNavigate()
  const isMobile = useIsMobile()
  const generalQuery = useQuery({
    ...settingsQueryOptions(),
    enabled: tab === "general",
  })
  const notificationsQuery = useQuery({
    ...notificationSettingsQueryOptions(),
    enabled: tab === "notifications",
  })

  function changeTab(value: unknown) {
    const parsed = settingsTabSchema.safeParse(value)
    if (!parsed.success) return
    void navigate({
      search: { tab: parsed.data },
      replace: true,
    })
  }

  const selectedQuery =
    tab === "general"
      ? generalQuery
      : tab === "notifications"
        ? notificationsQuery
        : null

  return (
    <section className="mx-auto w-full max-w-[1080px]">
      <Tabs
        value={tab}
        orientation={isMobile ? "horizontal" : "vertical"}
        onValueChange={changeTab}
        className="gap-6 md:flex-row md:gap-10 lg:gap-12"
      >
        <div className="min-w-0 shrink-0 md:w-48 lg:w-52">
          <p className="mb-3 hidden text-[11px] font-semibold tracking-[0.1em] text-muted-foreground uppercase md:block">
            {m.settings_title()}
          </p>
          <TabsList
            variant="line"
            aria-label={m.settings_navigation_label()}
            className="h-auto w-full justify-start gap-1 overflow-x-auto border-b p-0 pb-2 md:flex-col md:overflow-visible md:border-0 md:pb-0"
          >
            <SettingsTabTrigger value="general" icon={<Settings2Icon />}>
              {m.settings_tab_general()}
            </SettingsTabTrigger>
            <SettingsTabTrigger value="notifications" icon={<BellIcon />}>
              {m.settings_tab_notifications()}
            </SettingsTabTrigger>
            <SettingsTabTrigger value="security" icon={<ShieldCheckIcon />}>
              {m.settings_tab_security()}
            </SettingsTabTrigger>
          </TabsList>
        </div>

        <div className="min-w-0 flex-1">
          {selectedQuery?.isError ? (
            <ModuleError retry={() => void selectedQuery.refetch()} />
          ) : selectedQuery?.isLoading ? (
            <SettingsLoadingState tab={tab} />
          ) : (
            <>
              <TabsContent value="general">
                {generalQuery.data && (
                  <GeneralSettingsPanel settings={generalQuery.data.settings} />
                )}
              </TabsContent>
              <TabsContent value="notifications">
                {notificationsQuery.data && (
                  <NotificationSettingsPanel
                    preferences={notificationsQuery.data.preferences}
                    user={currentUser}
                  />
                )}
              </TabsContent>
              <TabsContent value="security">
                <SecuritySettingsPanel user={currentUser} />
              </TabsContent>
            </>
          )}
        </div>
      </Tabs>
    </section>
  )
}

function SettingsTabTrigger({
  children,
  icon,
  value,
}: {
  children: React.ReactNode
  icon: React.ReactNode
  value: SettingsTab
}) {
  return (
    <TabsTrigger
      value={value}
      className="h-10 flex-none justify-start gap-2.5 rounded-[7px] px-3 text-sm after:hidden md:w-full data-active:bg-accent data-active:font-semibold"
    >
      {icon}
      {children}
    </TabsTrigger>
  )
}
