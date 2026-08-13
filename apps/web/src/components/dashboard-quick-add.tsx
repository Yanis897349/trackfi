import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  BanknoteIcon,
  ChevronRightIcon,
  CreditCardIcon,
  PlusIcon,
  ReceiptTextIcon,
} from "lucide-react"

import { Button } from "@trackfi/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@trackfi/ui/components/dropdown-menu"

import { apiFetch } from "../lib/api"
import { expenseRequestBody, type ExpenseInput } from "../lib/expenses"
import { humanizeError } from "../lib/errors"
import { m } from "../lib/i18n"
import type { RevenueSourceInput } from "../lib/revenue"
import type { SubscriptionInput } from "../lib/subscriptions"
import { ExpenseFormDialog } from "./expense-form-dialog"
import { RevenueFormDialog } from "./revenue-form-dialog"
import { SubscriptionFormDialog } from "./subscription-form-dialog"

type QuickAddModule = "expenses" | "subscriptions" | "revenue"
type QuickAddInput =
  | { module: "expenses"; input: ExpenseInput; receipt: File | null }
  | { module: "subscriptions"; input: SubscriptionInput }
  | { module: "revenue"; input: RevenueSourceInput }

export function DashboardQuickAdd({ currency }: { currency: string | null }) {
  const queryClient = useQueryClient()
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeModule, setActiveModule] = useState<QuickAddModule | null>(null)
  const [message, setMessage] = useState("")
  const mutation = useMutation({
    mutationFn: (value: QuickAddInput) => {
      if (value.module === "expenses") {
        return apiFetch("/api/expenses", {
          method: "POST",
          body: expenseRequestBody(value.input, value.receipt),
        })
      }
      return apiFetch(
        value.module === "subscriptions"
          ? "/api/subscriptions"
          : "/api/revenue-sources",
        { method: "POST", body: JSON.stringify(value.input) }
      )
    },
    onSuccess: async (_data, value) => {
      setActiveModule(null)
      setMessage("")
      const moduleKeys: Record<QuickAddModule, string[]> = {
        expenses: ["expenses", "expense-summary", "expense-settings"],
        subscriptions: [
          "subscriptions",
          "subscription-summary",
          "subscription-calendar",
        ],
        revenue: ["revenue-sources", "revenue-summary"],
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-calendar"] }),
        ...moduleKeys[value.module].map((key) =>
          queryClient.invalidateQueries({ queryKey: [key] })
        ),
      ])
    },
    onError: (error) => setMessage(humanizeError(error)),
  })

  function openModule(module: QuickAddModule) {
    setMenuOpen(false)
    setMessage("")
    setActiveModule(module)
  }

  function closeDialog(open: boolean) {
    if (!open && !mutation.isPending) setActiveModule(null)
  }

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              className="h-9 gap-2 px-3 text-[13px]"
              disabled={!currency}
            />
          }
        >
          <PlusIcon /> {m.dashboard_quick_add()}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={8}
          className="w-[308px] rounded-[10px] p-2 shadow-[0_8px_24px_rgb(0_0_0/0.12)]"
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex h-[42px] items-center px-3 text-[13px] font-bold tracking-[0.03em]">
              {m.dashboard_add_new()}
            </DropdownMenuLabel>
            <QuickAddItem
              icon={ReceiptTextIcon}
              label={m.nav_expenses()}
              description={m.dashboard_quick_add_expense_description()}
              onClick={() => openModule("expenses")}
            />
            <QuickAddItem
              icon={CreditCardIcon}
              label={m.nav_subscriptions()}
              description={m.dashboard_quick_add_subscription_description()}
              onClick={() => openModule("subscriptions")}
            />
            <QuickAddItem
              icon={BanknoteIcon}
              label={m.nav_revenue()}
              description={m.dashboard_quick_add_revenue_description()}
              onClick={() => openModule("revenue")}
            />
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {currency && (
        <>
          <ExpenseFormDialog
            currency={currency}
            expense={null}
            open={activeModule === "expenses"}
            pending={mutation.isPending}
            error={message}
            onOpenChange={closeDialog}
            onOpenChangeComplete={() => undefined}
            onSubmit={(input, receipt) =>
              mutation.mutate({ module: "expenses", input, receipt })
            }
          />
          <SubscriptionFormDialog
            currency={currency}
            subscription={null}
            open={activeModule === "subscriptions"}
            pending={mutation.isPending}
            error={message}
            onOpenChange={closeDialog}
            onOpenChangeComplete={() => undefined}
            onSubmit={(input) =>
              mutation.mutate({ module: "subscriptions", input })
            }
          />
          <RevenueFormDialog
            currency={currency}
            source={null}
            open={activeModule === "revenue"}
            pending={mutation.isPending}
            error={message}
            onOpenChange={closeDialog}
            onOpenChangeComplete={() => undefined}
            onSubmit={(input) => mutation.mutate({ module: "revenue", input })}
          />
        </>
      )}
    </>
  )
}

function QuickAddItem({
  icon: Icon,
  label,
  description,
  onClick,
}: {
  icon: typeof ReceiptTextIcon
  label: string
  description: string
  onClick(): void
}) {
  return (
    <DropdownMenuItem
      className="h-[58px] gap-3 rounded-[7px] px-2.5"
      onClick={onClick}
    >
      <span className="flex size-9 items-center justify-center rounded-[7px] bg-muted">
        <Icon className="size-[18px] text-foreground" />
      </span>
      <span className="grid min-w-0 flex-1 gap-0.5">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        <span className="truncate text-xs text-muted-foreground">
          {description}
        </span>
      </span>
      <ChevronRightIcon className="size-4 text-muted-foreground/70" />
    </DropdownMenuItem>
  )
}
