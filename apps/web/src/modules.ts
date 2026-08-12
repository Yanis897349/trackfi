import type { ComponentType } from "react"
import type { LucideIcon } from "lucide-react"
import { BanknoteIcon, CreditCardIcon } from "lucide-react"

import { RevenueOverviewCard } from "./components/revenue-overview-card"
import { SubscriptionOverviewCard } from "./components/subscription-overview-card"

export interface TrackfiModule {
  id: "subscriptions" | "revenue"
  label: string
  description: string
  href: "/dashboard/subscriptions" | "/dashboard/revenue"
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
  {
    id: "revenue",
    label: "Revenue",
    description: "Forecast take-home income by source.",
    href: "/dashboard/revenue",
    icon: BanknoteIcon,
    DashboardCard: RevenueOverviewCard,
  },
]
