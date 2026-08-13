export function sumBy<T>(values: readonly T[], select: (value: T) => number) {
  return values.reduce((sum, value) => sum + select(value), 0)
}

export function percentageChange(
  current: number,
  previous: number,
  fractionDigits = 0
) {
  if (previous === 0) return null
  const precision = 10 ** fractionDigits
  return (
    Math.round(((current - previous) / Math.abs(previous)) * 100 * precision) /
    precision
  )
}
