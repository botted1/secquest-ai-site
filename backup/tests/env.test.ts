import { test } from "node:test"
import assert from "node:assert/strict"

test("env.ts throws when NVIDIA_API_KEY is missing", async (t) => {
  const original = { ...process.env }
  t.after(() => { process.env = original })

  delete process.env.NVIDIA_API_KEY
  process.env.ADMIN_USERNAME = "admin"
  process.env.ADMIN_PASSWORD = "longpassword12"
  process.env.AUTH_SECRET = "x".repeat(32)

  await assert.rejects(async () => {
    await import(`../lib/env.ts?t=${Date.now()}`)
  })
})

test("env.ts throws when ADMIN_PASSWORD is shorter than 12 chars", async (t) => {
  const original = { ...process.env }
  t.after(() => { process.env = original })

  process.env.NVIDIA_API_KEY = "nvapi-" + "x".repeat(20)
  process.env.ADMIN_USERNAME = "admin"
  process.env.ADMIN_PASSWORD = "short"
  process.env.AUTH_SECRET = "x".repeat(32)

  await assert.rejects(async () => {
    await import(`../lib/env.ts?t=${Date.now()}`)
  })
})

test("env.ts parses successfully when all required vars present", async (t) => {
  const original = { ...process.env }
  t.after(() => { process.env = original })

  process.env.NVIDIA_API_KEY = "nvapi-" + "x".repeat(20)
  process.env.ADMIN_USERNAME = "admin"
  process.env.ADMIN_PASSWORD = "longpassword12"
  process.env.AUTH_SECRET = "x".repeat(32)

  const mod = await import(`../lib/env.ts?t=${Date.now()}`)
  assert.equal(mod.env.ADMIN_USERNAME, "admin")
  assert.equal(mod.env.NVIDIA_BASE_URL, "https://integrate.api.nvidia.com/v1")
})
