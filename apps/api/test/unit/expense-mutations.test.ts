import { describe, expect, it, vi } from "vitest"

import { deleteReceiptInBackground } from "../../src/routes/expense-mutations"
import type { AppContext } from "../../src/types"

describe("expense receipt cleanup", () => {
  it("contains cleanup failures after a database mutation has committed", async () => {
    const waitUntil = vi.fn()
    const context = {
      env: {
        EXPENSE_RECEIPTS: {
          delete: vi.fn().mockRejectedValue(new Error("R2 unavailable")),
        },
      },
      executionCtx: { waitUntil },
    } as unknown as AppContext

    deleteReceiptInBackground(context, "old-receipt")

    expect(waitUntil).toHaveBeenCalledOnce()
    await expect(waitUntil.mock.calls[0]![0]).resolves.toBeUndefined()
  })
})
