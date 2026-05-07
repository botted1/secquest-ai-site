import { NextRequest, NextResponse } from "next/server"
import { getFileType } from "@/lib/document-parser"
import mammoth from "mammoth"
import { injectPolicyDocument } from "@/lib/vector-store"

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    const fileType = getFileType(file.name)

    if (fileType !== "pdf" && fileType !== "word") {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a PDF or Word document for policies." },
        { status: 400 }
      )
    }

    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 25MB." },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    let rawText = ""

    if (fileType === "pdf") {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse")
      const data = await pdfParse(buffer)
      rawText = data.text
    } else {
      const result = await mammoth.extractRawText({ buffer })
      rawText = result.value
    }

    if (!rawText.trim()) {
      return NextResponse.json(
        { error: "No text could be extracted from the document" },
        { status: 400 }
      )
    }

    const numChunks = await injectPolicyDocument(rawText)

    return NextResponse.json({
      success: true,
      chunks: numChunks,
      rawTextLength: rawText.length,
      message: `Successfully embedded ${numChunks} semantic chunks into local vector store.`,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("Knowledge base processing error:", message)
    return NextResponse.json(
      { error: `Failed to process security policy: ${message}` },
      { status: 500 }
    )
  }
}
