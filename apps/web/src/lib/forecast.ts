export function forecastTrendPercentage(current: number, previous: number) {
  return Math.round(((current - previous) / previous) * 1000) / 10
}

export function formatForecastTrend(value: number) {
  if (value === 0) return "0%"
  return `${value > 0 ? "+" : "−"}${Math.abs(value).toFixed(1)}%`
}
