import { createFileRoute } from "@tanstack/react-router"
import { Button } from "@trackfi/ui/components/button"

export const Route = createFileRoute("/")({
  component: IndexRoute,
})

function IndexRoute() {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <section className="flex max-w-md flex-col items-start gap-4">
        <p className="text-sm font-medium text-muted-foreground">Trackfi</p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Finance tracking foundation
        </h1>
        <p className="text-sm leading-6 text-pretty text-muted-foreground">
          The web app, shared UI system, and Cloudflare API are ready for the
          first product workflow.
        </p>
        <Button disabled>Foundation ready</Button>
      </section>
    </main>
  )
}
