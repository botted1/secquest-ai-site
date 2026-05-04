import * as XLSX from "xlsx"
import mammoth from "mammoth"
import { aiClient } from "./ai-client"

/**
 * Parse an Excel file (.xlsx / .xls) and extract all text content.
 * Iterates through all sheets, concatenating cell values.
 */
export async function parseExcel(buffer: Buffer): Promise<string> {
  const workbook = XLSX.read(buffer, { type: "buffer" })
  const allText: string[] = []

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    if (!sheet) continue

    allText.push(`--- Sheet: ${sheetName} ---`)

    // Convert to JSON rows for structured extraction
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      header: 1,
      defval: "",
    })

    for (const row of jsonData) {
      const values = Object.values(row as Record<string, unknown>)
      const rowText = values
        .map((v) => String(v).trim())
        .filter(Boolean)
        .join(" | ")
      if (rowText) {
        allText.push(rowText)
      }
    }
  }

  return allText.join("\n")
}

/**
 * Parse a Word document (.docx) and extract text content.
 */
export async function parseWord(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer })
  return result.value
}

/**
 * Use Claude 3 to intelligently identify and extract individual security questions
 * from raw document text. Returns an array of clean question strings.
 */
export async function extractQuestionsWithAI(rawText: string): Promise<string[]> {
  const prompt = `You are a security questionnaire parser. Analyze the following document text and extract every individual security question or requirement that needs to be answered.

Rules:
1. Extract ONLY the questions/requirements — not answers, headers, or instructions
2. Each question should be a complete, standalone sentence
3. If a question has sub-parts (e.g., a, b, c), treat each sub-part as a separate question but include the parent context
4. Clean up formatting artifacts (extra whitespace, bullet characters, etc.)
5. Preserve the original wording as much as possible
6. If the text contains numbered questions, preserve the numbering context
7. Return the questions as a JSON array of strings

Document text:
---
${rawText.slice(0, 15000)}
---

Return ONLY a valid JSON array of question strings, nothing else. Example:
["Does your organization have a documented information security policy?", "How do you handle encryption of data at rest?"]`

  try {
    const completion = await aiClient.chat.completions.create({
      model: "nvidia/nemotron-3-super-120b-a12b",
      messages: [{ role: "user", content: prompt }],
      temperature: 1,
      top_p: 0.95,
      max_tokens: 4096,
      // @ts-expect-error - nvidia specific params
      extra_body: {
        chat_template_kwargs: { enable_thinking: true },
        reasoning_budget: 16384
      }
    });

    const content = completion.choices[0]?.message?.content || "[]"

    // Extract JSON array from the response (handle markdown code blocks)
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const questions = JSON.parse(jsonMatch[0])
      return questions.filter((q: unknown): q is string => typeof q === "string" && q.trim().length > 10)
    }

    return []
  } catch (error) {
    console.error("Error extracting questions with AI:", error)
    throw new Error("Failed to extract questions from document")
  }
}

/**
 * Determine the file type from the filename extension.
 */
export function getFileType(filename: string): "pdf" | "excel" | "word" | "unknown" {
  const ext = filename.toLowerCase().split(".").pop()
  switch (ext) {
    case "pdf":
      return "pdf"
    case "xlsx":
    case "xls":
      return "excel"
    case "docx":
    case "doc":
      return "word"
    default:
      return "unknown"
  }
}

/**
 * Supported MIME types for upload validation.
 */
export const SUPPORTED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
  "application/vnd.ms-excel", // xls
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
  "application/msword", // doc
]

export const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB
