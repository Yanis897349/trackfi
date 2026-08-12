import { Card, CardContent, CardFooter } from "@trackfi/ui/components/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@trackfi/ui/components/table"

import { formatDateOnly } from "../lib/date"
import { expenseAmountSuffix, type Expense } from "../lib/expenses"
import { displayLabel, formatMoney } from "../lib/subscriptions"
import { ExpenseActions, type ExpenseListActions } from "./expense-actions"
import { ExpenseIcon, ExpenseStatusBadge } from "./expense-list-parts"
import { SubscriptionPagination } from "./subscription-list-parts"

export function ExpenseList({
  expenses,
  currency,
  page,
  total,
  onPageChange,
  ...actions
}: {
  expenses: Expense[]
  currency: string
  page: number
  total: number
  onPageChange(page: number): void
} & ExpenseListActions) {
  const shown = Math.min(page * 3, total)
  const pagination = {
    hasPrevious: page > 1,
    hasNext: shown < total,
    onPrevious: () => onPageChange(page - 1),
    onNext: () => onPageChange(page + 1),
  }
  return (
    <>
      <Card className="hidden gap-0 py-0 md:flex">
        <Table className="text-[13px]">
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Expense</TableHead>
              <TableHead className="w-[140px]">Category</TableHead>
              <TableHead className="w-[210px]">Amount</TableHead>
              <TableHead className="w-[155px]">Next expected</TableHead>
              <TableHead className="w-[110px]">Status</TableHead>
              <TableHead className="w-16">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id} className="h-[72px]">
                <TableCell className="pl-4">
                  <div className="flex items-center gap-3">
                    <ExpenseIcon />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {expense.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {expense.cadence === "once"
                          ? "One-time expense"
                          : `${formatMoney(expense.monthlyEquivalentMinor, currency)} projected monthly`}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{displayLabel(expense.category)}</TableCell>
                <TableCell className="font-medium">
                  {formatMoney(expense.amountMinor, currency)}{" "}
                  {expenseAmountSuffix(expense)}
                </TableCell>
                <TableCell>
                  {expense.nextExpenseDate
                    ? formatDateOnly(expense.nextExpenseDate)
                    : expense.scheduleType === "variable"
                      ? "Monthly estimate"
                      : "No upcoming expense"}
                </TableCell>
                <TableCell>
                  <ExpenseStatusBadge expense={expense} />
                </TableCell>
                <TableCell className="text-right">
                  <ExpenseActions expense={expense} {...actions} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <CardFooter className="h-14 justify-between bg-card px-4 py-0">
          <p className="text-xs text-muted-foreground">
            {shown} of {total} expenses
          </p>
          <SubscriptionPagination {...pagination} />
        </CardFooter>
      </Card>
      <div className="grid gap-3 md:hidden">
        {expenses.map((expense) => (
          <Card key={expense.id} size="sm">
            <CardContent className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 gap-3">
                <ExpenseIcon />
                <div className="min-w-0">
                  <p className="truncate font-medium">{expense.name}</p>
                  <p className="mt-1 text-sm">
                    {formatMoney(expense.amountMinor, currency)}{" "}
                    {expenseAmountSuffix(expense)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {expense.nextExpenseDate
                      ? `Next ${formatDateOnly(expense.nextExpenseDate)}`
                      : expense.scheduleType === "variable"
                        ? "Monthly estimate"
                        : "No upcoming expense"}{" "}
                    · {displayLabel(expense.category)}
                  </p>
                  <div className="mt-3">
                    <ExpenseStatusBadge expense={expense} />
                  </div>
                </div>
              </div>
              <ExpenseActions expense={expense} {...actions} />
            </CardContent>
          </Card>
        ))}
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted-foreground">
            {shown} of {total} expenses
          </p>
          <SubscriptionPagination {...pagination} />
        </div>
      </div>
    </>
  )
}
