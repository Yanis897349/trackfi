export function subscriptionBody(overrides: Record<string, unknown> = {}) {
  return {
    name: "Design software",
    amountMinor: 1000,
    cadence: "monthly",
    billingAnchor: "2024-01-31",
    category: "software",
    websiteUrl: "https://example.com",
    notes: "Team plan",
    ...overrides,
  }
}

export function revenueBody(overrides: Record<string, unknown> = {}) {
  return {
    name: "Primary job",
    amountMinor: 100_000,
    scheduleType: "scheduled",
    cadence: "biweekly",
    paymentAnchor: "2024-01-01",
    category: "salary",
    notes: "Net pay",
    ...overrides,
  }
}

export function expenseBody(overrides: Record<string, unknown> = {}) {
  return {
    merchant: "Rent",
    amountMinor: 100_000,
    transactionDate: "2024-01-20",
    category: "housing",
    status: "approved",
    reimbursable: false,
    notes: "Apartment",
    ...overrides,
  }
}
