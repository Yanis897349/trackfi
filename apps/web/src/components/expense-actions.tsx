import {
  ArchiveIcon,
  MoreHorizontalIcon,
  PauseIcon,
  PencilIcon,
  PlayIcon,
  RotateCcwIcon,
  Trash2Icon,
} from "lucide-react"

import { Button } from "@trackfi/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@trackfi/ui/components/dropdown-menu"

import type { Expense, ExpenseStatus } from "../lib/expenses"

export interface ExpenseListActions {
  onEdit(expense: Expense): void
  onStatus(expense: Expense, status: ExpenseStatus): void
  onDelete(expense: Expense): void
}

export function ExpenseActions({
  expense,
  onEdit,
  onStatus,
  onDelete,
}: { expense: Expense } & ExpenseListActions) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
        <MoreHorizontalIcon />
        <span className="sr-only">Actions for {expense.name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => onEdit(expense)}>
          <PencilIcon /> Edit
        </DropdownMenuItem>
        {expense.status === "active" && (
          <DropdownMenuItem onClick={() => onStatus(expense, "paused")}>
            <PauseIcon /> Pause
          </DropdownMenuItem>
        )}
        {expense.status === "paused" && (
          <DropdownMenuItem onClick={() => onStatus(expense, "active")}>
            <PlayIcon /> Resume
          </DropdownMenuItem>
        )}
        {expense.status === "archived" ? (
          <DropdownMenuItem onClick={() => onStatus(expense, "active")}>
            <RotateCcwIcon /> Restore
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => onStatus(expense, "archived")}>
            <ArchiveIcon /> Archive
          </DropdownMenuItem>
        )}
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
