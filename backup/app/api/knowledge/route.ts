import { NextRequest, NextResponse } from "next/server"
import { getFileType } from "@/lib/document-parser"
import fs from "fs/promises"
import path from "path"
import os from "os"
import mammoth from "mammoth"
import { injectPolicyDocument } from "@/lib/vector-store"

export const maxDuration = 300 // Allow up to 5 minutes for local embedding generation

export async function POST(request: NextRequest) {
  try {
    const { fileKey, fileName } = await request.json()

    if (!fileKey || !fileName) {
      return NextResponse.json(
        { error: "fileKey and fileName are required" },
        { status: 400 }
      )
    }

    const fileType = getFileType(fileName)
    let rawText = ""
    const filePath = path.join(os.tmpdir(), fileKey)
    
    // Read the file buffer from local /tmp
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

    // Process chunking and embeddings
    const numChunks = await injectPolicyDocument(rawText)

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
