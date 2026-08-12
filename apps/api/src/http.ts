export function inlineContentDisposition(value: string) {
  const fallback = value.replace(/[^\x20-\x7e]|["\\]/g, "_")
  const encoded = encodeURIComponent(value).replace(
    /[!'()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`
  )
  return `inline; filename="${fallback}"; filename*=UTF-8''${encoded}`
}
