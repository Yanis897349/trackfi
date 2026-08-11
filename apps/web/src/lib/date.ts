export function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(typeof value === "string" ? new Date(value) : value)
}
