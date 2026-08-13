import type { LucideIcon } from "lucide-react"
import { BanknoteIcon, CreditCardIcon, ReceiptTextIcon } from "lucide-react"

import { m } from "./lib/i18n"

export interface TrackfiModule {
  id: "subscriptions" | "expenses" | "revenue"
  label: string
  description: string
  href:
    "/dashboard/subscriptions" | "/dashboard/expenses" | "/dashboard/revenue"
  icon: LucideIcon
}

export const modules: TrackfiModule[] = [
  {
    id: "subscriptions",
    label: m.nav_subscriptions(),
    description: m.module_subscriptions_description(),
    href: "/dashboard/subscriptions",
    icon: CreditCardIcon,
  },
  {
    id: "expenses",
    label: m.nav_expenses(),
    description: m.module_expenses_description(),
    href: "/dashboard/expenses",
    icon: ReceiptTextIcon,
  },
  {
    id: "revenue",
    label: m.nav_revenue(),
    description: m.module_revenue_description(),
    href: "/dashboard/revenue",
    icon: BanknoteIcon,
  },
]
