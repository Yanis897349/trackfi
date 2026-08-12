import { m } from "./i18n"

const categories = {
  benefits: m.category_benefits,
  business: m.category_business,
  education: m.category_education,
  entertainment: m.category_entertainment,
  finance: m.category_finance,
  food: m.category_food,
  freelance: m.category_freelance,
  health: m.category_health,
  housing: m.category_housing,
  infrastructure: m.category_infrastructure,
  investments: m.category_investments,
  other: m.category_other,
  pension: m.category_pension,
  rental: m.category_rental,
  salary: m.category_salary,
  shopping: m.category_shopping,
  software: m.category_software,
  transport: m.category_transport,
  travel: m.category_travel,
  utilities: m.category_utilities,
} as const

const statuses = {
  active: m.status_active,
  above: m.status_above,
  all: m.status_all,
  approved: m.status_approved,
  archived: m.status_archived,
  current: m.status_current,
  below: m.status_below,
  declined: m.status_declined,
  paused: m.status_paused,
  pending: m.status_pending,
  on: m.status_on,
  registered: m.status_registered,
} as const

const cadences = {
  once: m.cadence_once,
  weekly: m.cadence_weekly,
  biweekly: m.cadence_biweekly,
  monthly: m.cadence_monthly,
  quarterly: m.cadence_quarterly,
  semiannual: m.cadence_semiannual,
  yearly: m.cadence_yearly,
} as const

export function categoryLabel(value: keyof typeof categories) {
  return categories[value]()
}

export function statusLabel(value: keyof typeof statuses) {
  return statuses[value]()
}

export function cadenceLabel(value: keyof typeof cadences) {
  return cadences[value]()
}

export function localizedLabel(value: string) {
  if (value in categories) {
    return categoryLabel(value as keyof typeof categories)
  }
  if (value in statuses) return statusLabel(value as keyof typeof statuses)
  if (value in cadences) return cadenceLabel(value as keyof typeof cadences)
  return value
}
