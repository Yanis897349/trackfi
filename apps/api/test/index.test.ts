import { exports } from "cloudflare:workers"
import { describe, expect, it } from "vitest"

describe("Trackfi API", () => {
  it("reports its health", async () => {
    const response = await exports.default.fetch(
      new Request("https://trackfi.test/health")
    )

    expect(response.status).toBe(200)
    expect(response.headers.get("content-type")).toContain("application/json")
    expect(response.headers.get("cache-control")).toBe("no-store")
    await expect(response.json()).resolves.toEqual({
      status: "ok",
      service: "trackfi-api",
    })
  })

  it("returns 404 for unknown routes", async () => {
    const response = await exports.default.fetch(
      new Request("https://trackfi.test/unknown")
    )

    expect(response.status).toBe(404)
  })
})
