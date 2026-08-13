import { createFileRoute } from "@tanstack/react-router"

import { NotificationHistory } from "../components/notification-history"

export const Route = createFileRoute("/dashboard/notifications")({
  component: NotificationHistory,
})
