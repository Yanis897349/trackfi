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

import type { RevenueSource, RevenueStatus } from "../lib/revenue"
import { m } from "../lib/i18n"

export interface RevenueListActions {
  onEdit(source: RevenueSource): void
  onStatus(source: RevenueSource, status: RevenueStatus): void
  onDelete(source: RevenueSource): void
}

export function RevenueActions({
  source,
  onEdit,
  onStatus,
  onDelete,
}: { source: RevenueSource } & RevenueListActions) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
        <MoreHorizontalIcon />
        <span className="sr-only">
          {m.common_actions_for({ name: source.name })}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => onEdit(source)}>
          <PencilIcon /> {m.common_edit()}
        </DropdownMenuItem>
        {source.status === "active" && (
          <DropdownMenuItem onClick={() => onStatus(source, "paused")}>
            <PauseIcon /> {m.common_pause()}
          </DropdownMenuItem>
        )}
        {source.status === "paused" && (
          <DropdownMenuItem onClick={() => onStatus(source, "active")}>
            <PlayIcon /> {m.common_resume()}
          </DropdownMenuItem>
        )}
        {source.status === "archived" ? (
          <DropdownMenuItem onClick={() => onStatus(source, "active")}>
            <RotateCcwIcon /> {m.common_restore()}
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => onStatus(source, "archived")}>
            <ArchiveIcon /> {m.common_archive()}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => onDelete(source)}
        >
          <Trash2Icon /> {m.common_delete()}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
