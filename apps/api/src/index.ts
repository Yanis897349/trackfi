import { Hono } from "hono"

const app = new Hono<{ Bindings: CloudflareBindings }>()

app.get("/health", (context) => {
  context.header("Cache-Control", "no-store")

  return context.json({
    status: "ok",
    service: "trackfi-api",
  })
})

app.notFound((context) =>
  context.json(
    {
      error: "not_found",
    },
    404
  )
)

export { app }
export default app
