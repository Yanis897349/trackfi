import { describe, expect, it } from "vitest"

import { expenseBody } from "../support/fixtures"
import {
  createUserSession,
  userApi,
  userMultipartApi,
} from "../support/requests"

import "../support/setup"

describe("expenses", () => {
  it("manages expense transactions, budgets, receipts, and user isolation", async () => {
    const cookie = await createUserSession()
    expect(
      (
        await userApi("/api/expenses", cookie, {
          method: "POST",
          body: expenseBody(),
        })
      ).status
    ).toBe(409)
    await userApi("/api/settings", cookie, {
      method: "PATCH",
      body: { currency: "EUR" },
    })
    const savedExpenseSettings = await userApi(
      "/api/expenses/settings",
      cookie,
      {
        method: "PATCH",
        body: {
          monthlyBudgetMinor: 300_000,
          dailyTargetMinor: 10_000,
          budgetPeriod: "monthly",
          resetDay: 15,
          rolloverEnabled: true,
          approachingThreshold: 80,
          limitThreshold: 100,
        },
      }
    )
    expect(savedExpenseSettings.status).toBe(200)
    const rent = await userApi("/api/expenses", cookie, {
      method: "POST",
      body: expenseBody(),
    })
    expect(rent.status).toBe(201)
    const rentBody = await rent.json<{
      expense: { id: string; status: string }
    }>()
    expect(rentBody.expense).toMatchObject({
      status: "approved",
    })
    const coffee = await userMultipartApi("/api/expenses", cookie, {
      payload: expenseBody({
        merchant: "Coffee",
        amountMinor: 5_000,
        transactionDate: "2024-01-20",
        category: "food",
        status: "pending",
      }),
      receipt: new File(["%PDF-1.7\nreceipt"], "收据-📄.pdf", {
        type: "application/pdf",
      }),
    })
    expect(coffee.status).toBe(201)
    const coffeeBody = await coffee.json<{
      expense: { id: string; receipt: { name: string } }
    }>()
    expect(coffeeBody.expense.receipt.name).toBe("收据-📄.pdf")
    await userApi("/api/expenses", cookie, {
      method: "POST",
      body: expenseBody({
        merchant: "Declined purchase",
        amountMinor: 50_000,
        status: "declined",
      }),
    })
    expect(
      (
        await userApi("/api/expenses", cookie, {
          method: "POST",
          body: expenseBody({ status: "unknown" }),
        })
      ).status
    ).toBe(400)

    await expect(
      (await userApi("/api/expenses/summary?asOf=2024-01-20", cookie)).json()
    ).resolves.toMatchObject({
      summary: {
        currency: "EUR",
        period: {
          start: "2024-01-15",
          end: "2024-02-14",
          elapsedDays: 6,
          totalDays: 31,
        },
        spentMinor: 105_000,
        pendingCount: 1,
        missingReceiptCount: 1,
        categoryBreakdown: expect.arrayContaining([
          { category: "housing", totalMinor: 100_000 },
          { category: "food", totalMinor: 5_000 },
        ]),
      },
    })
    await expect(
      (
        await userApi(
          "/api/expenses?status=pending&category=food&missingReceipt=false",
          cookie
        )
      ).json()
    ).resolves.toMatchObject({
      total: 1,
      expenses: [{ merchant: "Coffee", status: "pending" }],
    })
    await expect(
      (
        await userApi(
          "/api/expenses?from=2024-01-15&to=2024-02-14&missingReceipt=true",
          cookie
        )
      ).json()
    ).resolves.toMatchObject({
      total: 1,
      expenses: [{ merchant: "Rent", status: "approved" }],
    })

    const otherCookie = await createUserSession()
    await expect(
      (await userApi("/api/expenses", otherCookie)).json()
    ).resolves.toMatchObject({ total: 0, expenses: [] })
    expect(
      (
        await userApi(`/api/expenses/${rentBody.expense.id}`, otherCookie, {
          method: "PATCH",
          body: { status: "declined" },
        })
      ).status
    ).toBe(404)
    expect(
      (
        await userApi(
          `/api/expenses/${coffeeBody.expense.id}/receipt`,
          otherCookie
        )
      ).status
    ).toBe(404)
    const receipt = await userApi(
      `/api/expenses/${coffeeBody.expense.id}/receipt`,
      cookie
    )
    expect(receipt.status).toBe(200)
    expect(receipt.headers.get("content-type")).toContain("application/pdf")
    expect(receipt.headers.get("content-disposition")).toContain(
      "filename*=UTF-8''%E6%94%B6%E6%8D%AE-%F0%9F%93%84.pdf"
    )
    await expect(
      (
        await userApi(`/api/expenses/${rentBody.expense.id}`, cookie, {
          method: "PATCH",
          body: { status: "pending", reimbursable: true },
        })
      ).json()
    ).resolves.toMatchObject({
      expense: { status: "pending", reimbursable: true },
    })
    await expect(
      (
        await userApi(`/api/expenses/${coffeeBody.expense.id}`, cookie, {
          method: "PATCH",
          body: { removeReceipt: true },
        })
      ).json()
    ).resolves.toMatchObject({ expense: { receipt: null } })
    const conflict = await userApi("/api/settings", cookie, {
      method: "PATCH",
      body: { currency: "JPY" },
    })
    await expect(conflict.json()).resolves.toMatchObject({ expenseCount: 3 })
    await userApi("/api/settings", cookie, {
      method: "PATCH",
      body: { currency: "JPY", confirmRelabel: true },
    })
    await expect(
      (await userApi("/api/expenses", cookie)).json()
    ).resolves.toMatchObject({
      expenses: expect.arrayContaining([
        expect.objectContaining({ merchant: "Rent", amountMinor: 1000 }),
        expect.objectContaining({ merchant: "Coffee", amountMinor: 50 }),
      ]),
    })
    await expect(
      (await userApi("/api/expenses/settings", cookie)).json()
    ).resolves.toMatchObject({
      settings: { monthlyBudgetMinor: 3000, dailyTargetMinor: 100 },
    })
    expect(
      (
        await userApi(`/api/expenses/${rentBody.expense.id}`, cookie, {
          method: "DELETE",
        })
      ).status
    ).toBe(400)
    expect(
      (
        await userApi(
          `/api/expenses/${rentBody.expense.id}?confirm=true`,
          cookie,
          { method: "DELETE" }
        )
      ).status
    ).toBe(204)
  })
})
