import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, redirect } from "@tanstack/react-router"

import { Button } from "@trackfi/ui/components/button"

import { FormMessage } from "../components/auth-shell"
import { WaitlistAdminTable } from "../components/waitlist-admin-table"
import { apiFetch, getSession } from "../lib/api"
import { humanizeError } from "../lib/errors"
import type { WaitlistResponse, WaitlistStatus } from "../lib/waitlist"

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

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Waitlist approvals
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Approve pending emails and manage registration invitations.
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
              {option}
            </Button>
          )
        )}
      </div>
      {message && <FormMessage>{message}</FormMessage>}
      <WaitlistAdminTable
        entries={query.data?.entries ?? []}
        invitationPending={invitationPending}
        isLoading={query.isLoading}
        onInvitation={mutateInvitation}
        status={status}
      />
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Page {page} of {totalPages}
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Previous
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </section>
  )
}
