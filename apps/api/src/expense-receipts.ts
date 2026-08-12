import { hasBytePrefix } from "./binary"
import type { AppContext } from "./types"

const maxReceiptBytes = 10 * 1024 * 1024
const receiptTypes = new Map([
  ["application/pdf", ["pdf"]],
  ["image/jpeg", ["jpg", "jpeg"]],
  ["image/png", ["png"]],
])

export async function parseExpenseRequest(context: AppContext) {
  const contentType = context.req.header("content-type") ?? ""
  if (!contentType.startsWith("multipart/form-data")) {
    return {
      payload: await context.req.json().catch(() => null),
      receipt: null,
    }
  }
  const form = await context.req.formData().catch(() => null)
  if (!form) return { payload: null, receipt: null }
  const payload = form.get("payload")
  const receipt = form.get("receipt")
  let parsedPayload: unknown = null
  if (typeof payload === "string") {
    try {
      parsedPayload = JSON.parse(payload)
    } catch {
      parsedPayload = null
    }
  }
  return {
    payload: parsedPayload,
    receipt: receipt instanceof File ? receipt : null,
  }
}

export async function validateReceipt(file: File) {
  const extensions = receiptTypes.get(file.type)
  const extension = file.name.split(".").pop()?.toLocaleLowerCase()
  if (
    !extensions ||
    !extension ||
    !extensions.includes(extension) ||
    file.size < 1 ||
    file.size > maxReceiptBytes
  ) {
    return false
  }
  const header = new Uint8Array(await file.slice(0, 8).arrayBuffer())
  if (file.type === "application/pdf") {
    return hasBytePrefix(header, [0x25, 0x50, 0x44, 0x46])
  }
  if (file.type === "image/jpeg") {
    return hasBytePrefix(header, [0xff, 0xd8, 0xff])
  }
  return hasBytePrefix(header, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
}

export async function storeReceipt(
  bucket: R2Bucket,
  userId: string,
  file: File
) {
  const extension = file.name.split(".").pop()!.toLocaleLowerCase()
  const key = `${userId}/${crypto.randomUUID()}.${extension}`
  await bucket.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
    customMetadata: { originalName: file.name },
  })
  return { key, name: file.name, contentType: file.type, size: file.size }
}
