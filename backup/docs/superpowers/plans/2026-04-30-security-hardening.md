# Security Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the hardcoded NVIDIA API key, gate all API routes behind authentication, validate inputs with Zod, fix the path-traversal vector, add per-user rate limiting, structured audit logging, and baseline security headers — without scope-creeping into infrastructure changes.

**Architecture:** Layered defense. Foundation modules (env, ai-client, require-auth, validate, rate-limit, audit-log, file-key, file-type-detect) ship first with unit tests using Node's built-in `node:test` runner. Routes then become thin orchestrators: `requireAuth → rateLimit → parseBody(zod) → handler → audit`. No security logic lives in handler bodies.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Zod (already installed), `file-type` (new — magic-byte sniffing), `node:test` for unit tests (built into Node 22, zero deps), NextAuth v5 (already installed).

**Spec:** [docs/superpowers/specs/2026-04-30-security-hardening-design.md](../specs/2026-04-30-security-hardening-design.md)

**Working directory:** `/Users/yash/Documents/git-secquest/backup`

**Pre-flight checks the executor must run first:**
1. Confirm `pnpm install` completes without errors.
2. Confirm `pnpm build` succeeds on the current `yp` branch (baseline).
3. Confirm `.env.local` exists and is gitignored (it is — verified).
4. Read this whole plan before starting.

---

## Task 1: Add `lib/env.ts` with Zod-validated environment access

**Files:**
- Create: `lib/env.ts`
- Create: `tests/env.test.ts`
- Create: `.env.example`
- Modify: `package.json` (add test script and `engines`)

- [ ] **Step 1.1: Add npm test script and engines field to `package.json`**

Open `package.json`. Inside `"scripts"`, add a `test` line. Add a top-level `"engines"` block.

```json
{
  "name": "my-project",
  "version": "0.1.0",
  "private": true,
  "engines": {
    "node": ">=20.0.0"
  },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "test": "node --test --experimental-strip-types --no-warnings tests/**/*.test.ts"
  },
  ...
}
```

Note: `--experimental-strip-types` is supported in Node 22 (the installed version is `v22.16.0`). It allows running TypeScript files directly without compilation.

- [ ] **Step 1.2: Write the failing test for `lib/env.ts`**

Create `tests/env.test.ts`:

```ts
import { test } from "node:test"
import assert from "node:assert/strict"

test("env.ts throws when NVIDIA_API_KEY is missing", async () => {
  const original = { ...process.env }
  delete process.env.NVIDIA_API_KEY
  process.env.ADMIN_USERNAME = "admin"
  process.env.ADMIN_PASSWORD = "longpassword12"
  process.env.AUTH_SECRET = "x".repeat(32)

  await assert.rejects(async () => {
    await import(`../lib/env.ts?t=${Date.now()}`)
  })

  process.env = original
})

test("env.ts throws when ADMIN_PASSWORD is shorter than 12 chars", async () => {
  const original = { ...process.env }
  process.env.NVIDIA_API_KEY = "nvapi-" + "x".repeat(20)
  process.env.ADMIN_USERNAME = "admin"
  process.env.ADMIN_PASSWORD = "short"
  process.env.AUTH_SECRET = "x".repeat(32)

  await assert.rejects(async () => {
    await import(`../lib/env.ts?t=${Date.now()}`)
  })

  process.env = original
})

test("env.ts parses successfully when all required vars present", async () => {
  const original = { ...process.env }
  process.env.NVIDIA_API_KEY = "nvapi-" + "x".repeat(20)
  process.env.ADMIN_USERNAME = "admin"
  process.env.ADMIN_PASSWORD = "longpassword12"
  process.env.AUTH_SECRET = "x".repeat(32)

  const mod = await import(`../lib/env.ts?t=${Date.now()}`)
  assert.equal(mod.env.ADMIN_USERNAME, "admin")
  assert.equal(mod.env.NVIDIA_BASE_URL, "https://integrate.api.nvidia.com/v1")

  process.env = original
})
```

- [ ] **Step 1.3: Run the test and confirm it fails**

```bash
pnpm test
```

Expected: Tests fail with "Cannot find module '../lib/env.ts'".

- [ ] **Step 1.4: Implement `lib/env.ts`**

Create `lib/env.ts`:

```ts
import { z } from "zod"

const Env = z.object({
  NVIDIA_API_KEY: z.string().min(20),
  NVIDIA_BASE_URL: z.string().url().default("https://integrate.api.nvidia.com/v1"),
  ADMIN_USERNAME: z.string().min(1),
  ADMIN_PASSWORD: z.string().min(12),
  AUTH_SECRET: z.string().min(32),
  AWS_REGION: z.string().default("ap-southeast-2"),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
})

const parsed = Env.safeParse(process.env)
if (!parsed.success) {
  const issues = parsed.error.issues.map(i => `  - ${i.path.join(".")}: ${i.message}`).join("\n")
  throw new Error(`Invalid environment configuration:\n${issues}`)
}

export const env = parsed.data
```

- [ ] **Step 1.5: Run tests and confirm they pass**

```bash
pnpm test
```

Expected: All three env tests pass.

- [ ] **Step 1.6: Create `.env.example`**

Create `.env.example`:

```
# NVIDIA NIM API
NVIDIA_API_KEY=nvapi-replace-with-your-key
# NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1  # optional override

# Admin credentials (DEMO ONLY — replace with real auth before production use)
# Password must be at least 12 characters
ADMIN_USERNAME=admin
ADMIN_PASSWORD=replace-with-strong-password

# NextAuth — generate with: openssl rand -base64 32
AUTH_SECRET=replace-with-32-char-random-string

# AWS (only required if using Bedrock/Textract/S3 paths — currently unused)
# AWS_REGION=ap-southeast-2
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
```

- [ ] **Step 1.7: Update local `.env.local` to include `NVIDIA_API_KEY` and rename `NEXTAUTH_SECRET` → `AUTH_SECRET`**

The current `.env.local` has `NEXTAUTH_SECRET` but the schema requires `AUTH_SECRET` (NextAuth v5 canonical). Add or rename:

```bash
# In .env.local — DO NOT commit:
# Add: NVIDIA_API_KEY=<the new key from NVIDIA console after rotation>
# Rename: NEXTAUTH_SECRET → AUTH_SECRET (or add AUTH_SECRET alongside)
```

The executor should prompt the user to do this manually if `.env.local` is incomplete. Do NOT commit `.env.local`.

- [ ] **Step 1.8: Commit**

```bash
git add lib/env.ts tests/env.test.ts .env.example package.json
git commit -m "feat(security): add Zod-validated env loader with fail-fast startup"
```

---

## Task 2: Create `lib/ai-client.ts` and migrate the three lib files to use it

**Files:**
- Create: `lib/ai-client.ts`
- Modify: `lib/vector-store.ts:1-9`
- Modify: `lib/document-parser.ts:1-9`
- Modify: `lib/questionnaire-analyzer.ts:1-9`

**Why this task matters:** This is the task that removes the hardcoded NVIDIA API key from source. After this lands, the key only lives in `.env.local`.

- [ ] **Step 2.1: Create `lib/ai-client.ts`**

```ts
import OpenAI from "openai"
import { env } from "./env"

export const aiClient = new OpenAI({
  baseURL: env.NVIDIA_BASE_URL,
  apiKey: env.NVIDIA_API_KEY,
})
```

- [ ] **Step 2.2: Modify `lib/vector-store.ts` to use the shared client**

Replace the top of the file (lines 1-9 of the original file) with:

```ts
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { aiClient } from "./ai-client"
```

Then in the file body, replace every reference to `openai` with `aiClient`. Verify with grep:

```bash
grep -n "openai\|aiClient" lib/vector-store.ts
```

Expected: only `aiClient` references remain (no bare `openai` variable).

- [ ] **Step 2.3: Modify `lib/document-parser.ts` to use the shared client**

Replace the imports/top section (lines 1-9 originally) with:

```ts
import { aiClient } from "./ai-client"
```

…keeping any other existing imports (e.g., `xlsx`, `mammoth`). Replace every `openai` reference with `aiClient`. Verify:

```bash
grep -n "openai\|aiClient" lib/document-parser.ts
```

Expected: only `aiClient` references.

- [ ] **Step 2.4: Modify `lib/questionnaire-analyzer.ts` to use the shared client**

Replace the imports/top section (lines 1-9 originally) with:

```ts
import { queryVectorStore } from "./vector-store"
import { aiClient } from "./ai-client"
```

Replace every `openai` reference with `aiClient`. Verify:

```bash
grep -n "openai\|aiClient" lib/questionnaire-analyzer.ts
```

Expected: only `aiClient` references.

- [ ] **Step 2.5: Confirm no hardcoded keys remain anywhere**

```bash
grep -rn "nvapi-" lib app
```

Expected: zero matches.

- [ ] **Step 2.6: Run the build to confirm nothing broke**

```bash
pnpm build
```

Expected: build succeeds. (If it fails because `.env.local` is missing `NVIDIA_API_KEY` or `AUTH_SECRET`, populate them per Task 1, Step 1.7 first — that is a configuration issue, not a code bug.)

- [ ] **Step 2.7: Commit**

```bash
git add lib/ai-client.ts lib/vector-store.ts lib/document-parser.ts lib/questionnaire-analyzer.ts
git commit -m "feat(security): centralize NVIDIA client; remove hardcoded API key from source

The leaked key remains in git history (commit 2f1b335) and must be
rotated in the NVIDIA console separately. Code merge does not
invalidate exposed credentials."
```

---

## Task 3: Update `lib/auth.ts` to remove insecure fallbacks

**Files:**
- Modify: `lib/auth.ts`

- [ ] **Step 3.1: Replace the contents of `lib/auth.ts`**

```ts
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { env } from "./env"

// DEMO ONLY: single-admin credential. Replace with a real user table /
// OAuth provider before any multi-tenant or production use.
export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: env.AUTH_SECRET,
  providers: [
    Credentials({
      name: "SecQuest AI",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "admin" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (
          credentials?.username === env.ADMIN_USERNAME &&
          credentials?.password === env.ADMIN_PASSWORD
        ) {
          return {
            id: "1",
            name: "SecQuest Admin",
            email: "admin@secquest.ai",
          }
        }
        return null
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
})
```

- [ ] **Step 3.2: Run the build to verify**

```bash
pnpm build
```

Expected: build succeeds.

- [ ] **Step 3.3: Commit**

```bash
git add lib/auth.ts
git commit -m "feat(security): remove insecure fallback admin credentials

ADMIN_USERNAME, ADMIN_PASSWORD, and AUTH_SECRET are now required
environment variables. App refuses to boot without them."
```

---

## Task 4: Create `lib/api/require-auth.ts`

**Files:**
- Create: `lib/api/require-auth.ts`

This helper has no unit test — it's a thin wrapper over NextAuth's `auth()` and is exercised by route-level integration tests in Task 11+.

- [ ] **Step 4.1: Create the file**

```ts
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { Session } from "next-auth"

export type AuthGuardResult =
  | { ok: true; session: Session }
  | { ok: false; response: NextResponse }

export async function requireAuth(): Promise<AuthGuardResult> {
  const session = await auth()
  if (!session?.user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }
  return { ok: true, session }
}
```

- [ ] **Step 4.2: Run build to verify type imports resolve**

```bash
pnpm build
```

Expected: build succeeds.

- [ ] **Step 4.3: Commit**

```bash
git add lib/api/require-auth.ts
git commit -m "feat(security): add requireAuth helper for API routes"
```

---

## Task 5: Create `lib/api/file-key.ts` with regex + post-resolution containment check

**Files:**
- Create: `lib/api/file-key.ts`
- Create: `tests/file-key.test.ts`

- [ ] **Step 5.1: Write the failing tests**

Create `tests/file-key.test.ts`:

```ts
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
```

- [ ] **Step 5.2: Run the test and confirm it fails**

```bash
pnpm test
```

Expected: Tests fail with module not found.

- [ ] **Step 5.3: Implement `lib/api/file-key.ts`**

```ts
import os from "node:os"
import path from "node:path"
import { z } from "zod"

const FILE_KEY_RE = /^secquest_uploads\/\d+_[a-zA-Z0-9._-]+$/

export const SafeFileKey = z.string().regex(FILE_KEY_RE, "Invalid fileKey format")

export function resolveSafePath(fileKey: string): string {
  if (!FILE_KEY_RE.test(fileKey)) {
    throw new Error("Invalid fileKey")
  }
  const base = path.join(os.tmpdir(), "secquest_uploads")
  const resolved = path.join(os.tmpdir(), fileKey)
  if (!resolved.startsWith(base + path.sep)) {
    throw new Error("Path escape detected")
  }
  return resolved
}
```

- [ ] **Step 5.4: Run tests and confirm pass**

```bash
pnpm test
```

Expected: All four file-key tests pass.

- [ ] **Step 5.5: Commit**

```bash
git add lib/api/file-key.ts tests/file-key.test.ts
git commit -m "feat(security): add SafeFileKey validator and resolveSafePath

Closes the path-traversal vector in /api/extract and /api/knowledge."
```

---

## Task 6: Create `lib/api/validate.ts` (Zod body parser)

**Files:**
- Create: `lib/api/validate.ts`

- [ ] **Step 6.1: Implement the helper**

```ts
import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse }

export async function parseBody<T>(
  req: NextRequest,
  schema: z.ZodType<T>
): Promise<ParseResult<T>> {
  let json: unknown
  try {
    json = await req.json()
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid JSON" }, { status: 400 }),
    }
  }
  const result = schema.safeParse(json)
  if (!result.success) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Invalid request", issues: result.error.issues },
        { status: 400 }
      ),
    }
  }
  return { ok: true, data: result.data }
}
```

- [ ] **Step 6.2: Build to verify**

```bash
pnpm build
```

Expected: build succeeds.

- [ ] **Step 6.3: Commit**

```bash
git add lib/api/validate.ts
git commit -m "feat(security): add parseBody helper for Zod-validated route inputs"
```

---

## Task 7: Create `lib/api/rate-limit.ts` (token bucket)

**Files:**
- Create: `lib/api/rate-limit.ts`
- Create: `tests/rate-limit.test.ts`

- [ ] **Step 7.1: Write failing tests**

Create `tests/rate-limit.test.ts`:

```ts
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
```

- [ ] **Step 7.2: Run tests and confirm failure**

```bash
pnpm test
```

Expected: rate-limit tests fail with module not found.

- [ ] **Step 7.3: Implement `lib/api/rate-limit.ts`**

```ts
type Bucket = { tokens: number; lastRefill: number }

// In-memory token-bucket rate limiter.
// TODO: swap for Redis (@upstash/ratelimit) when scaling beyond one instance —
// in-memory state resets on cold start and does not share across regions.
const buckets = new Map<string, Bucket>()

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfter: number }

export function rateLimit(
  key: string,
  opts: { capacity: number; refillPerSec: number }
): RateLimitResult {
  const now = Date.now()
  const b = buckets.get(key) ?? { tokens: opts.capacity, lastRefill: now }
  const elapsed = (now - b.lastRefill) / 1000
  b.tokens = Math.min(opts.capacity, b.tokens + elapsed * opts.refillPerSec)
  b.lastRefill = now
  if (b.tokens < 1) {
    buckets.set(key, b)
    return { ok: false, retryAfter: Math.ceil((1 - b.tokens) / opts.refillPerSec) }
  }
  b.tokens -= 1
  buckets.set(key, b)
  return { ok: true }
}

// Test-only: clear the bucket map between tests.
export function _resetForTests(): void {
  buckets.clear()
}
```

- [ ] **Step 7.4: Run tests and confirm pass**

```bash
pnpm test
```

Expected: all four rate-limit tests pass.

- [ ] **Step 7.5: Commit**

```bash
git add lib/api/rate-limit.ts tests/rate-limit.test.ts
git commit -m "feat(security): add in-memory token-bucket rate limiter"
```

---

## Task 8: Create `lib/api/audit-log.ts`

**Files:**
- Create: `lib/api/audit-log.ts`

- [ ] **Step 8.1: Implement**

```ts
export type AuditAction =
  | "upload"
  | "extract"
  | "analyze"
  | "knowledge.ingest"
  | "auth.fail"
  | "rate_limit.hit"
  | "validation.fail"

export interface AuditEvent {
  action: AuditAction
  userId?: string
  ip?: string
  meta?: Record<string, unknown>
}

export function audit(event: AuditEvent): void {
  console.log(JSON.stringify({ ts: new Date().toISOString(), ...event }))
}
```

- [ ] **Step 8.2: Build to verify**

```bash
pnpm build
```

Expected: build succeeds.

- [ ] **Step 8.3: Commit**

```bash
git add lib/api/audit-log.ts
git commit -m "feat(security): add structured audit logger"
```

---

## Task 9: Add `file-type` dependency and create `lib/file-type-detect.ts`

**Files:**
- Modify: `package.json` (add `file-type` dependency)
- Create: `lib/file-type-detect.ts`
- Create: `tests/file-type-detect.test.ts`

- [ ] **Step 9.1: Install `file-type`**

```bash
pnpm add file-type
```

Expected: package added; `pnpm-lock.yaml` updates.

- [ ] **Step 9.2: Write the failing tests**

Create `tests/file-type-detect.test.ts`:

```ts
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
```

- [ ] **Step 9.3: Run tests and confirm failure**

```bash
pnpm test
```

Expected: file-type-detect tests fail with module not found.

- [ ] **Step 9.4: Implement `lib/file-type-detect.ts`**

```ts
import { fileTypeFromBuffer } from "file-type"

export type DeclaredType = "pdf" | "excel" | "word"

const ALLOWED_MIMES: Record<DeclaredType, string[]> = {
  pdf: ["application/pdf"],
  excel: [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
  ],
  word: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "application/zip", // .docx is a zip — `file-type` may report this
  ],
}

export type VerifyResult =
  | { ok: true; mime: string }
  | { ok: false; reason: string }

export async function verifyFileType(
  buffer: Buffer,
  declared: DeclaredType
): Promise<VerifyResult> {
  const allowed = ALLOWED_MIMES[declared]
  if (!allowed) return { ok: false, reason: `Unknown declared type: ${declared}` }

  const detected = await fileTypeFromBuffer(buffer)
  if (!detected) {
    return { ok: false, reason: "Could not detect file type from content" }
  }
  if (!allowed.includes(detected.mime)) {
    return {
      ok: false,
      reason: `Declared ${declared} but content is ${detected.mime}`,
    }
  }
  return { ok: true, mime: detected.mime }
}
```

- [ ] **Step 9.5: Run tests and confirm pass**

```bash
pnpm test
```

Expected: all three file-type-detect tests pass.

Note: if a real PDF/DOCX produces unexpected detection results, adjust the `ALLOWED_MIMES` map to include the actually-detected MIME. The xlsx/docx ZIP case is already covered.

- [ ] **Step 9.6: Commit**

```bash
git add package.json pnpm-lock.yaml lib/file-type-detect.ts tests/file-type-detect.test.ts
git commit -m "feat(security): add magic-byte file-type verification"
```

---

## Task 10: Migrate `/api/extract` route (pilot — verify the pattern works end-to-end)

**Files:**
- Modify: `app/api/extract/route.ts`

- [ ] **Step 10.1: Replace the contents of `app/api/extract/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server"
import fs from "node:fs/promises"
import { z } from "zod"
import { parseExcel, parseWord, extractQuestionsWithAI, getFileType } from "@/lib/document-parser"
import { requireAuth } from "@/lib/api/require-auth"
import { rateLimit } from "@/lib/api/rate-limit"
import { parseBody } from "@/lib/api/validate"
import { audit } from "@/lib/api/audit-log"
import { SafeFileKey, resolveSafePath } from "@/lib/api/file-key"

export const maxDuration = 60

const ExtractSchema = z.object({
  fileKey: SafeFileKey,
  fileName: z.string().min(1).max(255),
})

export async function POST(req: NextRequest) {
  const guard = await requireAuth()
  if (!guard.ok) return guard.response

  const userId = guard.session.user!.id
  const limit = rateLimit(`extract:${userId}`, { capacity: 10, refillPerSec: 1 / 60 })
  if (!limit.ok) {
    audit({ action: "rate_limit.hit", userId, meta: { route: "extract" } })
    return NextResponse.json(
      { error: "Rate limited" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    )
  }

  const body = await parseBody(req, ExtractSchema)
  if (!body.ok) {
    audit({ action: "validation.fail", userId, meta: { route: "extract" } })
    return body.response
  }

  try {
    const fileType = getFileType(body.data.fileName)
    let rawText = ""
    const filePath = resolveSafePath(body.data.fileKey)
    const buffer = await fs.readFile(filePath)

    if (fileType === "pdf") {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse")
      const data = await pdfParse(buffer)
      rawText = data.text
    } else if (fileType === "excel") {
      rawText = await parseExcel(buffer)
    } else if (fileType === "word") {
      rawText = await parseWord(buffer)
    } else {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 })
    }

    if (!rawText.trim()) {
      return NextResponse.json(
        { error: "No text could be extracted from the document" },
        { status: 400 }
      )
    }

    const questions = await extractQuestionsWithAI(rawText)
    if (questions.length === 0) {
      return NextResponse.json(
        { error: "No security questions were identified in the document" },
        { status: 400 }
      )
    }

    audit({
      action: "extract",
      userId,
      meta: { fileName: body.data.fileName, questionCount: questions.length },
    })
    return NextResponse.json({
      questions,
      questionCount: questions.length,
      rawTextLength: rawText.length,
      message: `Successfully extracted ${questions.length} questions`,
    })
  } catch (error) {
    console.error("Extract error:", error)
    return NextResponse.json(
      { error: "Failed to extract questions from document" },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 10.2: Run build**

```bash
pnpm build
```

Expected: build succeeds.

- [ ] **Step 10.3: Manual verification — start dev server**

```bash
pnpm dev
```

In a separate terminal, run these curl checks against `http://localhost:3000`.

- [ ] **Step 10.4: Verify 401 without auth**

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/extract \
  -H "Content-Type: application/json" \
  -d '{"fileKey":"secquest_uploads/123_x.pdf","fileName":"x.pdf"}'
```

Expected: `401`.

- [ ] **Step 10.5: Verify 400 on path traversal attempt (after logging in)**

After logging in via `/login` (use the credentials from `.env.local`), grab the session cookie from your browser devtools and substitute it in:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/extract \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=<paste-from-devtools>" \
  -d '{"fileKey":"../../../etc/passwd","fileName":"x.pdf"}'
```

Expected: `400` with `issues` array mentioning `fileKey` regex failure.

- [ ] **Step 10.6: Verify 400 on malformed JSON**

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/extract \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=<paste-from-devtools>" \
  -d 'not-json'
```

Expected: `400`.

- [ ] **Step 10.7: Verify the happy path still works via the UI**

Open `http://localhost:3000/agent`, log in, upload a real questionnaire (PDF/Word/Excel). Confirm questions are extracted. Watch the dev terminal for an audit-log entry like:

```
{"ts":"...","action":"extract","userId":"1","meta":{"fileName":"...","questionCount":N}}
```

Stop the dev server (Ctrl+C) when done.

- [ ] **Step 10.8: Commit**

```bash
git add app/api/extract/route.ts
git commit -m "feat(security): harden /api/extract with auth, validation, rate limit, audit"
```

---

## Task 11: Migrate `/api/knowledge` route

**Files:**
- Modify: `app/api/knowledge/route.ts`

- [ ] **Step 11.1: Replace the contents of `app/api/knowledge/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server"
import fs from "node:fs/promises"
import { z } from "zod"
import mammoth from "mammoth"
import { getFileType } from "@/lib/document-parser"
import { requireAuth } from "@/lib/api/require-auth"
import { rateLimit } from "@/lib/api/rate-limit"
import { parseBody } from "@/lib/api/validate"
import { audit } from "@/lib/api/audit-log"
import { SafeFileKey, resolveSafePath } from "@/lib/api/file-key"
import { injectPolicyDocument } from "@/lib/vector-store"

export const maxDuration = 300

const KnowledgeSchema = z.object({
  fileKey: SafeFileKey,
  fileName: z.string().min(1).max(255),
})

export async function POST(req: NextRequest) {
  const guard = await requireAuth()
  if (!guard.ok) return guard.response

  const userId = guard.session.user!.id
  const limit = rateLimit(`knowledge:${userId}`, { capacity: 10, refillPerSec: 1 / 60 })
  if (!limit.ok) {
    audit({ action: "rate_limit.hit", userId, meta: { route: "knowledge" } })
    return NextResponse.json(
      { error: "Rate limited" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    )
  }

  const body = await parseBody(req, KnowledgeSchema)
  if (!body.ok) {
    audit({ action: "validation.fail", userId, meta: { route: "knowledge" } })
    return body.response
  }

  try {
    const fileType = getFileType(body.data.fileName)
    let rawText = ""
    const filePath = resolveSafePath(body.data.fileKey)
    const buffer = await fs.readFile(filePath)

    if (fileType === "pdf") {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse")
      const data = await pdfParse(buffer)
      rawText = data.text
    } else if (fileType === "word") {
      const result = await mammoth.extractRawText({ buffer })
      rawText = result.value
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a PDF or Word document for policies." },
        { status: 400 }
      )
    }

    if (!rawText.trim()) {
      return NextResponse.json(
        { error: "No text could be extracted from the document" },
        { status: 400 }
      )
    }

    const numChunks = await injectPolicyDocument(rawText)

    audit({
      action: "knowledge.ingest",
      userId,
      meta: { fileName: body.data.fileName, chunks: numChunks },
    })
    return NextResponse.json({
      success: true,
      chunks: numChunks,
      rawTextLength: rawText.length,
      message: `Successfully embedded ${numChunks} semantic chunks into local vector store.`,
    })
  } catch (error) {
    console.error("Knowledge base processing error:", error)
    return NextResponse.json(
      { error: "Failed to process security policy. Ensure the file is not corrupted." },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 11.2: Build to verify**

```bash
pnpm build
```

Expected: build succeeds.

- [ ] **Step 11.3: Manual smoke test via UI**

Start `pnpm dev`. Log in, go to `/knowledge`, upload a small policy PDF. Confirm the success response and an audit-log entry appears.

- [ ] **Step 11.4: Commit**

```bash
git add app/api/knowledge/route.ts
git commit -m "feat(security): harden /api/knowledge with auth, validation, rate limit, audit"
```

---

## Task 12: Migrate `/api/upload` route (multipart, with magic-byte verification)

**Files:**
- Modify: `app/api/upload/route.ts`

- [ ] **Step 12.1: Replace the contents of `app/api/upload/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server"
import fs from "node:fs/promises"
import path from "node:path"
import os from "node:os"
import { SUPPORTED_MIME_TYPES, MAX_FILE_SIZE, getFileType } from "@/lib/document-parser"
import { requireAuth } from "@/lib/api/require-auth"
import { rateLimit } from "@/lib/api/rate-limit"
import { audit } from "@/lib/api/audit-log"
import { verifyFileType } from "@/lib/file-type-detect"

export async function POST(req: NextRequest) {
  const guard = await requireAuth()
  if (!guard.ok) return guard.response

  const userId = guard.session.user!.id
  const limit = rateLimit(`upload:${userId}`, { capacity: 10, refillPerSec: 1 / 60 })
  if (!limit.ok) {
    audit({ action: "rate_limit.hit", userId, meta: { route: "upload" } })
    return NextResponse.json(
      { error: "Rate limited" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    )
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    audit({ action: "validation.fail", userId, meta: { route: "upload", reason: "bad-multipart" } })
    return NextResponse.json({ error: "Invalid multipart body" }, { status: 400 })
  }

  const file = formData.get("file")
  if (!(file instanceof File)) {
    audit({ action: "validation.fail", userId, meta: { route: "upload", reason: "no-file" } })
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  const declared = getFileType(file.name)
  if (declared === "unknown") {
    audit({ action: "validation.fail", userId, meta: { route: "upload", reason: "extension" } })
    return NextResponse.json(
      { error: "Unsupported file type. Supported: PDF, Excel (.xlsx/.xls), Word (.docx/.doc)" },
      { status: 400 }
    )
  }

  if (file.size > MAX_FILE_SIZE) {
    audit({ action: "validation.fail", userId, meta: { route: "upload", reason: "size", size: file.size } })
    return NextResponse.json(
      { error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
      { status: 400 }
    )
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const verify = await verifyFileType(buffer, declared as "pdf" | "excel" | "word")
  if (!verify.ok) {
    audit({ action: "validation.fail", userId, meta: { route: "upload", reason: "magic-byte", detail: verify.reason } })
    return NextResponse.json(
      { error: `File content does not match declared type: ${verify.reason}` },
      { status: 400 }
    )
  }

  const timestamp = Date.now()
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
  const fileKey = `secquest_uploads/${timestamp}_${sanitizedName}`
  const filePath = path.join(os.tmpdir(), fileKey)
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, buffer)

  audit({
    action: "upload",
    userId,
    meta: { fileName: file.name, fileType: declared, fileSize: file.size },
  })
  return NextResponse.json({
    fileKey,
    fileName: file.name,
    fileType: declared,
    fileSize: file.size,
    message: "File uploaded successfully to local storage",
  })
}
```

Note: `SUPPORTED_MIME_TYPES` is left imported because the surrounding code references it via `getFileType`. If lint warns about an unused import, remove it.

- [ ] **Step 12.2: Build**

```bash
pnpm build
```

Expected: build succeeds.

- [ ] **Step 12.3: Manual smoke test**

Start `pnpm dev`. Upload a real PDF via `/agent`. Confirm success and an audit-log entry. Try uploading a `.txt` renamed to `.pdf` — confirm it's rejected with a clear error.

- [ ] **Step 12.4: Commit**

```bash
git add app/api/upload/route.ts
git commit -m "feat(security): harden /api/upload with auth, magic-byte check, rate limit, audit"
```

---

## Task 13: Migrate `/api/analyze` route

**Files:**
- Modify: `app/api/analyze/route.ts`

- [ ] **Step 13.1: Replace the contents of `app/api/analyze/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { analyzeQuestionnaire } from "@/lib/questionnaire-analyzer"
import { requireAuth } from "@/lib/api/require-auth"
import { rateLimit } from "@/lib/api/rate-limit"
import { parseBody } from "@/lib/api/validate"
import { audit } from "@/lib/api/audit-log"

export const maxDuration = 300

const AnalyzeSchema = z.object({
  questions: z.array(z.string().min(5).max(2000)).min(1).max(100),
})

export async function POST(req: NextRequest) {
  const guard = await requireAuth()
  if (!guard.ok) return guard.response

  const userId = guard.session.user!.id
  // Heavier endpoint — embeddings + LLM loop. 5 calls capacity, refill one every 2 min.
  const limit = rateLimit(`analyze:${userId}`, { capacity: 5, refillPerSec: 1 / 120 })
  if (!limit.ok) {
    audit({ action: "rate_limit.hit", userId, meta: { route: "analyze" } })
    return NextResponse.json(
      { error: "Rate limited" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    )
  }

  const body = await parseBody(req, AnalyzeSchema)
  if (!body.ok) {
    audit({ action: "validation.fail", userId, meta: { route: "analyze" } })
    return body.response
  }

  try {
    const results = await analyzeQuestionnaire(body.data.questions)
    const stats = {
      total: results.length,
      highConfidence: results.filter((r) => r.confidence === "high").length,
      mediumConfidence: results.filter((r) => r.confidence === "medium").length,
      lowConfidence: results.filter((r) => r.confidence === "low").length,
      needsReview: results.filter((r) => r.needsReview).length,
      averageConfidence: Math.round(
        results.reduce((sum, r) => sum + r.confidenceScore, 0) / results.length
      ),
    }

    audit({
      action: "analyze",
      userId,
      meta: { questionCount: body.data.questions.length, averageConfidence: stats.averageConfidence },
    })
    return NextResponse.json({
      results,
      stats,
      message: `Successfully analyzed ${results.length} questions`,
    })
  } catch (error) {
    console.error("Analyze error:", error)
    return NextResponse.json(
      { error: "Failed to analyze questions. Please check your Bedrock configuration." },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 13.2: Build**

```bash
pnpm build
```

Expected: build succeeds.

- [ ] **Step 13.3: Manual smoke test via UI**

Start `pnpm dev`. Run a small questionnaire end-to-end (upload → extract → analyze). Confirm answers appear and an `analyze` audit entry is logged.

- [ ] **Step 13.4: Commit**

```bash
git add app/api/analyze/route.ts
git commit -m "feat(security): harden /api/analyze with auth, validation, rate limit, audit"
```

---

## Task 14: Add security headers to `next.config.mjs`

**Files:**
- Modify: `next.config.mjs`

- [ ] **Step 14.1: Read the current `next.config.mjs`**

```bash
cat next.config.mjs
```

- [ ] **Step 14.2: Add a `headers()` block**

If the existing config exports `{}` or only minimal options, transform it to:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://integrate.api.nvidia.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ]
  },
}

export default nextConfig
```

If the existing file already has fields, **merge** rather than overwrite — preserve any existing settings and add the `headers` async function alongside them.

- [ ] **Step 14.3: Build to verify config parses**

```bash
pnpm build
```

Expected: build succeeds.

- [ ] **Step 14.4: Manually verify headers in dev**

```bash
pnpm dev
```

In another terminal:

```bash
curl -sI http://localhost:3000/ | grep -E "Content-Security-Policy|Strict-Transport-Security|X-Frame-Options|X-Content-Type-Options|Referrer-Policy|Permissions-Policy"
```

Expected: all six headers present.

Stop dev server.

- [ ] **Step 14.5: Spot-check the app still loads**

Reload `http://localhost:3000` in a browser. Open DevTools console — there should be no CSP violation errors. If a particular legitimate resource is blocked (e.g., an image host), expand `connect-src` / `img-src` to include it and rebuild.

- [ ] **Step 14.6: Commit**

```bash
git add next.config.mjs
git commit -m "feat(security): add CSP, HSTS, and clickjacking-protection headers"
```

---

## Task 15: Final verification & cleanup

**Files:**
- None modified — verification only.

- [ ] **Step 15.1: Confirm no hardcoded secrets remain**

```bash
grep -rn "nvapi-\|secquest2026\||| \"admin\"" lib app
```

Expected: zero matches in `lib/` or `app/` (the only matches should be in test files using fake `nvapi-xxx...` values, which is fine).

- [ ] **Step 15.2: Run all unit tests**

```bash
pnpm test
```

Expected: all tests pass (env, file-key, rate-limit, file-type-detect — ~14 tests).

- [ ] **Step 15.3: Run the production build**

```bash
pnpm build
```

Expected: build succeeds.

- [ ] **Step 15.4: Run the dev server and walk through the four manual checks below**

```bash
pnpm dev
```

For each check, paste the result into a scratchpad — you'll cite them in the final commit message.

**Check A — 401 without auth on every route:**
```bash
for route in upload extract analyze knowledge; do
  echo -n "$route: "
  curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/$route -H "Content-Type: application/json" -d '{}'
done
```
Expected: `401` for all four.

**Check B — 400 on Zod failure (after logging in, with session cookie):**
```bash
curl -s -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=<paste>" \
  -d '{"questions":[]}' | jq .
```
Expected: `{"error":"Invalid request","issues":[...]}`.

**Check C — 429 on rate-limit (run analyze 6 times in a row with valid input):**
```bash
for i in 1 2 3 4 5 6; do
  echo -n "$i: "
  curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/analyze \
    -H "Content-Type: application/json" \
    -H "Cookie: authjs.session-token=<paste>" \
    -d '{"questions":["What is your data retention policy?"]}'
done
```
Expected: first 5 return 200, the 6th returns `429`.

**Check D — security headers present:**
```bash
curl -sI http://localhost:3000/ | grep -E "Content-Security-Policy|Strict-Transport-Security|X-Frame-Options|X-Content-Type-Options|Referrer-Policy|Permissions-Policy"
```
Expected: 6 headers.

Stop dev server.

- [ ] **Step 15.5: Run `pnpm audit`**

```bash
pnpm audit
```

Triage any high-severity findings. If a high-severity issue is in our direct dependency tree and exploitable, open a follow-up task; otherwise note it in the commit message.

- [ ] **Step 15.6: Final commit**

```bash
git commit --allow-empty -m "chore(security): verification suite passes

Manual verification:
- 401 returned by /api/{upload,extract,analyze,knowledge} without session
- 400 + Zod issues on malformed bodies
- 429 + Retry-After on rate-limit hit
- Six security headers present on every response
- Unit suite: 14 tests passing
- pnpm build: success

Reminder: rotate the leaked NVIDIA API key (was nvapi-lxEl... committed in
2f1b335) and remove it from git history with git filter-repo if exposure
matters. Code merge does not invalidate exposed credentials."
```

---

## Self-review (executor: skip — already performed by plan author)

Spec coverage: env validation (T1) ✓ ai-client (T2) ✓ auth fallbacks removed (T3) ✓ require-auth (T4) ✓ file-key + path traversal (T5) ✓ Zod validate (T6) ✓ rate limit (T7) ✓ audit log (T8) ✓ magic-byte (T9) ✓ four routes migrated (T10–T13) ✓ security headers (T14) ✓ verification (T15) ✓.

Type consistency check: `requireAuth()` returns `{ ok, session | response }` — used identically in T10–T13. `parseBody()` returns `{ ok, data | response }` — used identically. `rateLimit()` returns `{ ok, retryAfter }` — used identically. `verifyFileType()` returns `{ ok, mime | reason }` — used in T12. `SafeFileKey` Zod type used in T10, T11. No drift.

Out-of-scope guardrails: no Redis, no real user table, no CSRF tokens, no nonce CSP, no git history rewrite. All deferred per spec.
