import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react"

import { Button } from "@trackfi/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@trackfi/ui/components/dropdown-menu"

import type { Expense } from "../lib/expenses"

export interface ExpenseListActions {
  onEdit(expense: Expense): void
  onDelete(expense: Expense): void
}

export function ExpenseActions({
  expense,
  onEdit,
  onDelete,
}: { expense: Expense } & ExpenseListActions) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
        <MoreHorizontalIcon />
        <span className="sr-only">Actions for {expense.merchant}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => onEdit(expense)}>
          <PencilIcon /> Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => onDelete(expense)}
        >
          <Trash2Icon /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
