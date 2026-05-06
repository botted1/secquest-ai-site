import { test } from "node:test"
import assert from "node:assert/strict"
import os from "node:os"
import path from "node:path"

// Set required env vars so importing transitively-loaded modules doesn't crash.
process.env.NVIDIA_API_KEY ||= "nvapi-" + "x".repeat(20)
process.env.ADMIN_USERNAME ||= "admin"
process.env.ADMIN_PASSWORD ||= "longpassword12"
process.env.AUTH_SECRET ||= "x".repeat(32)

const { resolveSafePath, SafeFileKey } = await import("../lib/api/file-key.ts")

test("SafeFileKey accepts well-formed keys", () => {
  const result = SafeFileKey.safeParse("secquest_uploads/1234567890_my_file.pdf")
  assert.equal(result.success, true)
})

test("SafeFileKey rejects path traversal attempts", () => {
  const cases = [
    "../../../etc/passwd",
    "secquest_uploads/../../etc/passwd",
    "secquest_uploads/123_../../../etc/passwd",
    "/etc/passwd",
    "secquest_uploads/123_file with spaces.pdf",
    "other_dir/123_file.pdf",
  ]
  for (const c of cases) {
    const result = SafeFileKey.safeParse(c)
    assert.equal(result.success, false, `Should reject: ${c}`)
  }
})

test("resolveSafePath returns a path under tmpdir/secquest_uploads", () => {
  const resolved = resolveSafePath("secquest_uploads/1234_file.pdf")
  const base = path.join(os.tmpdir(), "secquest_uploads")
  assert.ok(resolved.startsWith(base + path.sep), `Expected path under ${base}, got ${resolved}`)
})

test("resolveSafePath throws on traversal", () => {
  assert.throws(() => resolveSafePath("../../../etc/passwd"), /Invalid fileKey/)
})
