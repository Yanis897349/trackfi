import { useState } from "react"
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { createFileRoute, redirect } from "@tanstack/react-router"

import { Button } from "@trackfi/ui/components/button"
import { useStableLoadingState } from "@trackfi/ui/hooks/use-stable-loading-state"

import { FormMessage } from "../components/auth-shell"
import { ModuleError } from "../components/module-layout"
import { WaitlistAdminTable } from "../components/waitlist-admin-table"
import { apiFetch, getSession } from "../lib/api"
import { humanizeError } from "../lib/errors"
import type { WaitlistResponse, WaitlistStatus } from "../lib/waitlist"
import { m } from "../lib/i18n"
import { statusLabel } from "../lib/labels"

export const Route = createFileRoute("/dashboard/waitlist")({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session || session.user.role !== "admin") {
      throw redirect({ to: "/dashboard" })
    }
  },
  component: WaitlistAdminRoute,
})

function WaitlistAdminRoute() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<WaitlistStatus | "all">("pending")
  const [message, setMessage] = useState("")
  const query = useQuery({
    queryKey: ["admin-waitlist", status, page],
    queryFn: () =>
      apiFetch<WaitlistResponse>(
        `/api/admin/waitlist?page=${page}&status=${status}`
      ),
    placeholderData: keepPreviousData,
  })
  const { isPending: invitationPending, mutate: mutateInvitation } =
    useMutation({
      mutationFn: ({
        id,
        action,
      }: {
        action: "approve" | "resend"
        id: string
      }) =>
        apiFetch(
          `/api/admin/waitlist/${id}/${action === "approve" ? "approve" : "resend-invite"}`,
          { method: "POST" }
        ),
      onSuccess: async () => {
        setMessage("")
        await queryClient.invalidateQueries({ queryKey: ["admin-waitlist"] })
      },
      onError: (error) => setMessage(humanizeError(error)),
    })
  const totalPages = Math.max(
    1,
    Math.ceil((query.data?.total ?? 0) / (query.data?.pageSize ?? 25))
  )
  const loading = useStableLoadingState({
    isLoading: query.isLoading,
    isError: query.isError,
  })

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          {m.nav_waitlist()}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {m.admin_waitlist_description()}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {(["pending", "approved", "registered", "all"] as const).map(
          (option) => (
            <Button
              key={option}
              type="button"
              size="sm"
              variant={status === option ? "default" : "outline"}
              onClick={() => {
                setStatus(option)
                setPage(1)
              }}
              className="capitalize"
            >
              {statusLabel(option)}
            </Button>
          )
        )}
      </div>
      {message && <FormMessage>{message}</FormMessage>}
      {query.isError ? (
        <ModuleError retry={() => void query.refetch()} />
      ) : (
        <WaitlistAdminTable
          entries={query.data?.entries ?? []}
          invitationPending={invitationPending}
          isLoading={loading.shouldRender}
          isLoadingVisible={loading.isVisible}
          onInvitation={mutateInvitation}
        />
      )}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{m.admin_page({ page, total: totalPages })}</span>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            {m.common_previous()}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            {m.common_next()}
          </Button>
        </div>
      </div>
    </section>
  )
}
