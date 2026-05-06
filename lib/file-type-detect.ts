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
