import { NextRequest, NextResponse } from "next/server"
import fs from "node:fs/promises"
import path from "node:path"
import os from "node:os"
import { MAX_FILE_SIZE, getFileType } from "@/lib/document-parser"
import { requireAuth } from "@/lib/api/require-auth"
import { rateLimit } from "@/lib/api/rate-limit"
import { audit } from "@/lib/api/audit-log"
import { verifyFileType } from "@/lib/file-type-detect"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const guard = await requireAuth()
  if (!guard.ok) return guard.response

  const userId = guard.session.user.id
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
