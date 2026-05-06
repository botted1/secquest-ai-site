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

export const runtime = "nodejs"
export const maxDuration = 300

const KnowledgeSchema = z.object({
  fileKey: SafeFileKey,
  fileName: z.string().min(1).max(255),
})

export async function POST(req: NextRequest) {
  const guard = await requireAuth()
  if (!guard.ok) return guard.response

  const userId = guard.session.user.id
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
    audit({
      action: "knowledge.fail",
      userId,
      meta: {
        fileName: body.data.fileName,
        errorClass: error instanceof Error ? error.constructor.name : typeof error,
      },
    })
    return NextResponse.json(
      { error: "Failed to process security policy. Ensure the file is not corrupted." },
      { status: 500 }
    )
  }
}
