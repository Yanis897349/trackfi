import type { ComponentType } from "react"
import type { LucideIcon } from "lucide-react"
import { CreditCardIcon } from "lucide-react"

import { SubscriptionOverviewCard } from "./components/subscription-overview-card"

export interface TrackfiModule {
  id: "subscriptions"
  label: string
  description: string
  href: "/dashboard/subscriptions"
  icon: LucideIcon
  DashboardCard: ComponentType
}

export const modules: TrackfiModule[] = [
  {
    id: "subscriptions",
    label: "Subscriptions",
    description: "Track recurring services, costs, and renewal dates.",
    href: "/dashboard/subscriptions",
    icon: CreditCardIcon,
    DashboardCard: SubscriptionOverviewCard,
  },
]
