import { NextRequest, NextResponse } from "next/server"
import { parseExcel, parseWord, extractQuestionsWithAI, getFileType } from "@/lib/document-parser"
import fs from "fs/promises"
import path from "path"
import os from "os"

export const maxDuration = 60 // Allow up to 60s for Textract processing

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

    if (fileType === "pdf") {
      // Use pdf-parse for PDF documents instead of Amazon Textract
      rawText = await extractWithPdfParse(fileKey)
    } else if (fileType === "excel") {
      // Parse Excel directly using xlsx library
      const buffer = await getFileFromLocal(fileKey)
      rawText = await parseExcel(buffer)
    } else if (fileType === "word") {
      // Parse Word document using mammoth
      const buffer = await getFileFromLocal(fileKey)
      rawText = await parseWord(buffer)
    } else {
      return NextResponse.json(
        { error: "Unsupported file type" },
        { status: 400 }
      )
    }

    if (!rawText.trim()) {
      return NextResponse.json(
        { error: "No text could be extracted from the document" },
        { status: 400 }
      )
    }

    // Use Claude to intelligently parse questions from raw text
    const questions = await extractQuestionsWithAI(rawText)

    if (questions.length === 0) {
      return NextResponse.json(
        { error: "No security questions were identified in the document" },
        { status: 400 }
      )
    }

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

/**
 * Read a file from the local /tmp directory and return it as a Buffer.
 */
async function getFileFromLocal(fileKey: string): Promise<Buffer> {
  const filePath = path.join(os.tmpdir(), fileKey)
  return await fs.readFile(filePath)
}

/**
 * Use pdf-parse to extract text from a local PDF document.
 */
async function extractWithPdfParse(fileKey: string): Promise<string> {
  const buffer = await getFileFromLocal(fileKey)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse")
  const data = await pdfParse(buffer)
  return data.text
}
