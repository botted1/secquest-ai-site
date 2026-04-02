import { NextRequest, NextResponse } from "next/server"
import { SUPPORTED_MIME_TYPES, MAX_FILE_SIZE, getFileType } from "@/lib/document-parser"
import fs from "fs/promises"
import path from "path"
import os from "os"

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

    // Validate file type
    const fileType = getFileType(file.name)
    if (fileType === "unknown") {
      return NextResponse.json(
        { error: `Unsupported file type. Supported: PDF, Excel (.xlsx/.xls), Word (.docx/.doc)` },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Generate unique local key
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
    const fileKey = `secquest_uploads/${timestamp}_${sanitizedName}`

    // Upload to local /tmp directory
    const buffer = Buffer.from(await file.arrayBuffer())
    const filePath = path.join(os.tmpdir(), fileKey)
    
    // Ensure the directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    
    // Write file to disk
    await fs.writeFile(filePath, buffer)

    return NextResponse.json({
      fileKey,
      fileName: file.name,
      fileType,
      fileSize: file.size,
      message: "File uploaded successfully to local storage",
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload file. Please check your AWS configuration." },
      { status: 500 }
    )
  }
}
