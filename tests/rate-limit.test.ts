import { test } from "node:test"
import assert from "node:assert/strict"

process.env.NVIDIA_API_KEY ||= "nvapi-" + "x".repeat(20)
process.env.ADMIN_USERNAME ||= "admin"
process.env.ADMIN_PASSWORD ||= "longpassword12"
process.env.AUTH_SECRET ||= "x".repeat(32)

const { rateLimit, _resetForTests } = await import("../lib/api/rate-limit.ts")

test("rateLimit allows requests within capacity", () => {
  _resetForTests()
  for (let i = 0; i < 5; i++) {
    const r = rateLimit("user:a", { capacity: 5, refillPerSec: 0.001 })
    assert.equal(r.ok, true, `Request ${i + 1} should be allowed`)
  }
})

test("rateLimit rejects after capacity exhausted", () => {
  _resetForTests()
  for (let i = 0; i < 3; i++) rateLimit("user:b", { capacity: 3, refillPerSec: 0.001 })
  const r = rateLimit("user:b", { capacity: 3, refillPerSec: 0.001 })
  assert.equal(r.ok, false)
  if (!r.ok) {
    assert.ok(r.retryAfter > 0)
  }
})

test("rateLimit isolates keys", () => {
  _resetForTests()
  for (let i = 0; i < 3; i++) rateLimit("user:c", { capacity: 3, refillPerSec: 0.001 })
  const denied = rateLimit("user:c", { capacity: 3, refillPerSec: 0.001 })
  const allowed = rateLimit("user:d", { capacity: 3, refillPerSec: 0.001 })
  assert.equal(denied.ok, false)
  assert.equal(allowed.ok, true)
})

test("rateLimit refills tokens over time", async () => {
  _resetForTests()
  const opts = { capacity: 1, refillPerSec: 100 }
  rateLimit("user:e", opts) // exhaust
  const denied = rateLimit("user:e", opts)
  assert.equal(denied.ok, false)
  await new Promise(r => setTimeout(r, 50))
  const allowed = rateLimit("user:e", opts)
  assert.equal(allowed.ok, true)
})
