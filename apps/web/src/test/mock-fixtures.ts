export function sessionFor(role: "admin" | "user") {
  return {
    session: { id: "session-id" },
    user: {
      id: `${role}-id`,
      email: `${role}@example.com`,
      name: role === "admin" ? "Admin User" : "Regular User",
      locale: "en",
      role,
    },
  }
}

export function subscriptionFixture() {
  return {
    id: "subscription-id",
    name: "Design software",
    amountMinor: 1000,
    cadence: "monthly",
    billingAnchor: "2026-08-20",
    nextRenewalDate: "2026-08-20",
    category: "software",
    websiteUrl: "https://example.com",
    notes: null,
    status: "active",
    createdAt: "2026-08-11T00:00:00.000Z",
    updatedAt: "2026-08-11T00:00:00.000Z",
  }
}

export function revenueSourceFixture() {
  return {
    id: "revenue-source-id",
    name: "Primary job",
    amountMinor: 300000,
    scheduleType: "scheduled",
    cadence: "monthly",
    paymentAnchor: "2026-08-25",
    nextPaymentDate: "2026-08-25",
    category: "salary",
    notes: "Net salary",
    status: "active",
    monthlyEquivalentMinor: 300000,
    annualEquivalentMinor: 3600000,
    createdAt: "2026-08-11T00:00:00.000Z",
    updatedAt: "2026-08-11T00:00:00.000Z",
  }
}

export function expenseFixture() {
  return {
    id: "expense-id",
    merchant: "Rent",
    amountMinor: 120000,
    transactionDate: "2026-08-10",
    category: "housing",
    notes: "Apartment",
    status: "approved",
    reimbursable: false,
    receipt: null,
    createdAt: "2026-08-11T00:00:00.000Z",
    updatedAt: "2026-08-11T00:00:00.000Z",
  }
}
