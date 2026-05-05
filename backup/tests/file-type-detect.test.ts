import { test } from "node:test"
import assert from "node:assert/strict"

process.env.NVIDIA_API_KEY ||= "nvapi-" + "x".repeat(20)
process.env.ADMIN_USERNAME ||= "admin"
process.env.ADMIN_PASSWORD ||= "longpassword12"
process.env.AUTH_SECRET ||= "x".repeat(32)

const { verifyFileType } = await import("../lib/file-type-detect.ts")

// PDF magic bytes: 25 50 44 46 ("%PDF")
const pdfBuf = Buffer.concat([Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d]), Buffer.alloc(100)])

// ZIP/DOCX magic: 50 4B 03 04 ("PK..")
const zipBuf = Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.alloc(200)])

// Plain text — not in allowlist
const txtBuf = Buffer.from("just some plain text content here that is long enough\n".repeat(20))

test("verifyFileType accepts a real PDF buffer claiming pdf", async () => {
  const result = await verifyFileType(pdfBuf, "pdf")
  assert.equal(result.ok, true)
})

test("verifyFileType rejects a text buffer claiming pdf", async () => {
  const result = await verifyFileType(txtBuf, "pdf")
  assert.equal(result.ok, false)
})

test("verifyFileType rejects an unknown declared type", async () => {
  const result = await verifyFileType(pdfBuf, "unknown" as never)
  assert.equal(result.ok, false)
})
