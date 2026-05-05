import { NextRequest, NextResponse } from "next/server"
import fs from "node:fs/promises"
import { z } from "zod"
import { parseExcel, parseWord, extractQuestionsWithAI, getFileType } from "@/lib/document-parser"
import { requireAuth } from "@/lib/api/require-auth"
import { rateLimit } from "@/lib/api/rate-limit"
import { parseBody } from "@/lib/api/validate"
import { audit } from "@/lib/api/audit-log"
import { SafeFileKey, resolveSafePath } from "@/lib/api/file-key"

export const runtime = "nodejs"
export const maxDuration = 60

const ExtractSchema = z.object({
  fileKey: SafeFileKey,
  fileName: z.string().min(1).max(255),
})

export async function POST(req: NextRequest) {
  const guard = await requireAuth()
  if (!guard.ok) return guard.response

  const userId = guard.session.user.id
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
