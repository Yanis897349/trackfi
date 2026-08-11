import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
})

function DashboardHome() {
  const { currentUser } = Route.useRouteContext()
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-1 items-center">
      <div className="max-w-xl">
        <p className="text-sm text-muted-foreground">
          Welcome, {currentUser.name}
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">
          Your financial workspace is ready.
        </h2>
        <p className="mt-4 leading-7 text-muted-foreground">
          Subscription tracking, recurring income, investments, and projections
          will live here as Trackfi grows.
        </p>
      </div>
    </section>
  )
}
