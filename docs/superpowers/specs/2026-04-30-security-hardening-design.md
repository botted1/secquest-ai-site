# Comprehensive Security Hardening — Design

**Date:** 2026-04-30
**Status:** Draft → awaiting user approval
**Scope:** Secrets management, API authentication, input validation, path-traversal fix, rate limiting, audit logging, security headers.

---

## Problem statement

The SecQuest AI codebase has several concrete security weaknesses that should be addressed together as one coherent pass:

1. **Leaked credential.** A NVIDIA API key (`nvapi-lxEl...`) is hardcoded in three source files (`lib/vector-store.ts:8`, `lib/document-parser.ts:7`, `lib/questionnaire-analyzer.ts:6`) and committed to git history (commit `2f1b335`).
2. **Insecure default credentials.** The `authorize()` callback in `lib/auth.ts` falls back to `admin` / `secquest2026` if env vars are missing. The fallback works silently in any environment that forgets to set `ADMIN_PASSWORD`.
3. **Unauthenticated API routes.** All four API routes (`/api/upload`, `/api/extract`, `/api/analyze`, `/api/knowledge`) accept POST requests with no session check. Anyone can call them directly.
4. **Path traversal.** `app/api/extract/route.ts` and `app/api/knowledge/route.ts` accept a `fileKey` from the request body and concatenate it directly into a filesystem path via `path.join(os.tmpdir(), fileKey)`. A `fileKey` of `../../etc/passwd` reads arbitrary files.
5. **No request validation.** Despite Zod being installed, no API route validates its body. File-type checks are extension-only.
6. **No rate limiting.** A single client can call `/api/analyze` (which loops through embeddings + LLM calls) without bound.
7. **No security headers.** Missing CSP, HSTS, X-Frame-Options, etc.

---

## Goals & non-goals

**Goals**
- Eliminate the hardcoded credential from the codebase and document the rotation requirement.
- Make every API route enforce authentication, validate input with Zod, and respect a per-user rate limit.
- Close the path-traversal vector with both regex validation and post-resolution containment check.
- Validate uploaded file content via magic bytes, not just extension.
- Add baseline security headers.
- Emit a structured audit log for protected endpoints.
- Fail fast at startup if required env vars are missing or weak.

**Non-goals**
- Replacing the single-admin credentials provider with a real user system (product decision, not a security bug — left as `// DEMO ONLY`).
- Persistent rate-limit store (Redis/Upstash). In-memory is sufficient for a single-server deployment; documented as a future migration.
- Persistent vector store / file storage. That's the "reliability" track.
- CSRF tokens for API routes. JSON-only routes that require auth headers/cookies are not exploitable via classic CSRF; revisit if cookie-based cross-origin calls are added.
- Nonce-based CSP. Tightening past `'unsafe-inline'` requires significant Next.js + Tailwind work and is out of scope here.
- Rewriting git history to scrub the leaked key. Documented as a manual step the user must perform.

---

## Architecture overview

The work is layered: foundation modules ship first, then routes adopt them. Every protected route ends up as a thin orchestrator:

```
requireAuth → rateLimit → parseBody(zod) → handler logic → audit
```

No security logic lives in handler bodies.

### New files

```
lib/
  env.ts                  # Zod-validated env access (single import surface)
  ai-client.ts            # Shared OpenAI/NVIDIA client; replaces 3 hardcoded copies
  file-type-detect.ts     # Magic-byte sniffing wrapper around `file-type`
  api/
    require-auth.ts       # Auth-guard wrapper for route handlers
    rate-limit.ts         # Token-bucket rate limiter (in-memory, swappable)
    audit-log.ts          # Structured logger for mutating endpoints
    validate.ts           # Zod-based body parser with safe error responses
    file-key.ts           # fileKey validation + safe path resolution
```

### Modified files

- `lib/vector-store.ts`, `lib/document-parser.ts`, `lib/questionnaire-analyzer.ts` — import shared client; delete embedded keys.
- `lib/auth.ts` — drop fallback admin password; require env via `lib/env.ts`; require `AUTH_SECRET`.
- `app/api/upload/route.ts`, `app/api/extract/route.ts`, `app/api/analyze/route.ts`, `app/api/knowledge/route.ts` — wrap with auth + validate + rate-limit + audit; use `resolveSafePath()` for filesystem access.
- `next.config.mjs` — add security headers.
- `.env.example` — new file documenting required vars.
- `.gitignore` — verify `.env.local` is ignored.
- `package.json` — add `file-type` dependency; add `engines.node >= 20`.

---

## Detailed design

### 1. Secrets & env validation

**`lib/env.ts`** — fail-fast schema:

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

export const env = Env.parse(process.env)
```

If any required var is missing or `ADMIN_PASSWORD` is < 12 chars, the app refuses to boot. No silent fallbacks.

**`lib/ai-client.ts`** — single source of truth:

```ts
import OpenAI from "openai"
import { env } from "./env"

export const aiClient = new OpenAI({
  baseURL: env.NVIDIA_BASE_URL,
  apiKey: env.NVIDIA_API_KEY,
})
```

The three lib files import `aiClient` and remove their local instantiations.

**`lib/auth.ts` changes**
- Remove `|| "admin"` and `|| "secquest2026"` fallbacks.
- Read from `env.ADMIN_USERNAME` / `env.ADMIN_PASSWORD`.
- Add `// DEMO ONLY: single-admin credential. Replace with real user table for multi-tenant.` comment above the credentials provider.

**Manual rotation steps (documented in commit message)**
1. Revoke the leaked key in the NVIDIA console.
2. Issue a new key and place it in `.env.local` only.
3. Optional: run `git filter-repo` to scrub the key from history. Otherwise it remains in any clone or fork.

### 2. API authentication

**`lib/api/require-auth.ts`**:

```ts
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }
  return { ok: true as const, session }
}
```

Each protected route prepends:

```ts
const guard = await requireAuth()
if (!guard.ok) return guard.response
```

### 3. Input validation

**`lib/api/validate.ts`** — typed body parser:

```ts
export async function parseBody<T>(req: NextRequest, schema: z.ZodType<T>) {
  try {
    const json = await req.json()
    const result = schema.safeParse(json)
    if (!result.success) {
      return { ok: false as const, response: NextResponse.json({ error: "Invalid request", issues: result.error.issues }, { status: 400 }) }
    }
    return { ok: true as const, data: result.data }
  } catch {
    return { ok: false as const, response: NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }
  }
}
```

**Per-route schemas**

| Route | Schema |
|---|---|
| `/api/upload` | multipart (FormData, not JSON) — see note below |
| `/api/extract` | `{ fileKey: SafeFileKey, fileName: z.string().max(255) }` |
| `/api/knowledge` | `{ fileKey: SafeFileKey, fileName: z.string().max(255) }` |
| `/api/analyze` | `{ questions: z.array(z.string().min(5).max(2000)).max(100) }` |

**Note on `/api/upload`:** `parseBody()` is JSON-only and won't work for multipart uploads. The upload route validates separately: `file instanceof File`, `file.size ≤ MAX_FILE_SIZE`, declared MIME in the allowlist, and then magic-byte verification via `lib/file-type-detect.ts`. The other three routes use `parseBody()` with Zod.

### 4. Path-traversal fix

**`lib/api/file-key.ts`**:

```ts
const FILE_KEY_RE = /^secquest_uploads\/\d+_[a-zA-Z0-9._-]+$/

export const SafeFileKey = z.string().regex(FILE_KEY_RE)

export function resolveSafePath(fileKey: string): string {
  if (!FILE_KEY_RE.test(fileKey)) throw new Error("Invalid fileKey")
  const base = path.join(os.tmpdir(), "secquest_uploads")
  const resolved = path.join(os.tmpdir(), fileKey)
  if (!resolved.startsWith(base + path.sep)) throw new Error("Path escape detected")
  return resolved
}
```

Both regex and prefix check must fail for traversal to succeed (defense in depth).

### 5. Magic-byte file-type detection

**`lib/file-type-detect.ts`** — wraps the `file-type` npm package. At upload time, read the first 4100 bytes of the buffer and confirm the detected type matches the declared extension. Reject mismatches before writing to disk.

Allowed types: `application/pdf`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `application/msword`.

### 6. Rate limiting

**`lib/api/rate-limit.ts`** — in-memory token bucket:

```ts
type Bucket = { tokens: number; lastRefill: number }
const buckets = new Map<string, Bucket>()

export function rateLimit(key: string, opts: { capacity: number; refillPerSec: number }) {
  const now = Date.now()
  const b = buckets.get(key) ?? { tokens: opts.capacity, lastRefill: now }
  const elapsed = (now - b.lastRefill) / 1000
  b.tokens = Math.min(opts.capacity, b.tokens + elapsed * opts.refillPerSec)
  b.lastRefill = now
  if (b.tokens < 1) {
    buckets.set(key, b)
    return { ok: false as const, retryAfter: Math.ceil((1 - b.tokens) / opts.refillPerSec) }
  }
  b.tokens -= 1
  buckets.set(key, b)
  return { ok: true as const }
}
```

**Per-route limits** (capacity / refill):

| Route | Capacity | Refill |
|---|---|---|
| `/api/upload` | 10 | 1/min |
| `/api/extract` | 10 | 1/min |
| `/api/knowledge` | 10 | 1/min |
| `/api/analyze` | 5 | 1/2min (heavier — embeddings + LLM loop) |

**Key strategy**: prefer authenticated `userId`; fall back to client IP from `x-forwarded-for`.

**Limitations** (documented inline as `// TODO`):
- In-memory state resets on cold start.
- Does not share across multi-instance / multi-region deployments. Swap for `@upstash/ratelimit` or similar when scaling beyond one instance.

### 7. Audit logging

**`lib/api/audit-log.ts`**:

```ts
export function audit(event: {
  action: "upload" | "extract" | "analyze" | "knowledge.ingest" | "auth.fail" | "rate_limit.hit" | "validation.fail"
  userId?: string
  ip?: string
  meta?: Record<string, unknown>
}) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), ...event }))
}
```

JSON to stdout, picked up by any aggregator. Fired on success, on validation failure, and on rate-limit hits (so abuse patterns are visible). No PII beyond user ID.

### 8. Composition example

```ts
export async function POST(req: NextRequest) {
  const guard = await requireAuth()
  if (!guard.ok) return guard.response

  const userId = guard.session.user.id
  const limit = rateLimit(`extract:${userId}`, { capacity: 10, refillPerSec: 1/60 })
  if (!limit.ok) {
    audit({ action: "rate_limit.hit", userId, meta: { route: "extract" } })
    return NextResponse.json({ error: "Rate limited" }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } })
  }

  const body = await parseBody(req, ExtractSchema)
  if (!body.ok) {
    audit({ action: "validation.fail", userId, meta: { route: "extract" } })
    return body.response
  }

  // ... actual handler logic ...

  audit({ action: "extract", userId, meta: { fileName: body.data.fileName } })
  return NextResponse.json(result)
}
```

### 9. Security headers (`next.config.mjs`)

Applied to every route:

| Header | Value |
|---|---|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://integrate.api.nvidia.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |

`'unsafe-inline'` is retained because Next.js runtime + Tailwind require it. Tightening to nonces is a separate project.

---

## Rollout order

1. Land foundation modules (env, ai-client, require-auth, validate, rate-limit, audit-log, file-key, file-type-detect). No behavior change.
2. Migrate `/api/extract` end-to-end; verify locally.
3. Migrate `/api/upload`, `/api/analyze`, `/api/knowledge`.
4. Update `lib/auth.ts` to remove fallbacks. **This is the breaking change** — `.env.local` must be populated before this lands.
5. Add `next.config.mjs` headers.
6. Update `.env.example`; verify `.gitignore`.
7. Add `engines` and `file-type` to `package.json`; run `pnpm install`.
8. Run manual verification suite (below).
9. Commit message includes the rotation reminder.

---

## Verification

Manual checks before declaring done:

- [ ] Each `/api/*` route returns **401** when called without a session.
- [ ] Malformed JSON body → **400 Invalid JSON**.
- [ ] Body failing Zod schema → **400** with `issues` array.
- [ ] `fileKey: "../../etc/passwd"` → **400** (regex rejects).
- [ ] `fileKey` that passes regex but resolves outside base → **500/400** (containment check fires). Construct manually to test.
- [ ] Upload a `.pdf` file containing non-PDF magic bytes → **400** (rejected by `file-type`).
- [ ] Spam an endpoint past its capacity → **429** with `Retry-After` header.
- [ ] Boot the app with `ADMIN_PASSWORD` unset → app refuses to start with a clear error.
- [ ] Boot the app with `ADMIN_PASSWORD="short"` → refuses (< 12 chars).
- [ ] Inspect response headers in browser devtools → all six security headers present.
- [ ] Audit log entries appear on stdout for every protected action and on every rate-limit/validation failure.
- [ ] `pnpm build` succeeds.
- [ ] `pnpm audit` reviewed; high-severity findings triaged.

---

## Out of scope (explicitly)

- Multi-user auth system / user table / OAuth.
- Persistent rate-limit store (Redis/Upstash).
- Persistent vector store / file storage.
- CSRF tokens for API routes.
- Nonce-based CSP.
- Rewriting git history (manual step for the user).
- Rotating the leaked NVIDIA key (manual step for the user — code merge does not invalidate exposed credentials).

---

## Future follow-ups (not part of this work)

- Migrate rate limiter to Redis-backed store when deployment scales beyond one instance.
- Replace credentials provider with a real user table (and likely OAuth).
- Tighten CSP to nonce-based once Next.js/Tailwind tooling matures.
- Move file storage and vector store off `/tmp` to durable storage.
