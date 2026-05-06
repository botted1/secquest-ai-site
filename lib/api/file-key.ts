import os from "node:os"
import path from "node:path"
import { z } from "zod"

const FILE_KEY_RE = /^secquest_uploads\/\d+_[a-zA-Z0-9._-]+$/
const BLOB_URL_RE = /^https:\/\/[a-zA-Z0-9-]+\.public\.blob\.vercel-storage\.com\//

export const SafeFileKey = z.union([
  z.string().regex(FILE_KEY_RE, "Invalid fileKey format"),
  z.string().regex(BLOB_URL_RE, "Invalid blob URL"),
])

export function resolveSafePath(fileKey: string): string {
  if (!FILE_KEY_RE.test(fileKey)) {
    throw new Error("Invalid fileKey")
  }
  const base = path.join(os.tmpdir(), "secquest_uploads")
  const resolved = path.join(os.tmpdir(), fileKey)
  if (!resolved.startsWith(base + path.sep)) {
    throw new Error("Path escape detected")
  }
  return resolved
}

export async function getFileBuffer(fileKey: string): Promise<Buffer> {
  if (BLOB_URL_RE.test(fileKey)) {
    const res = await fetch(fileKey)
    if (!res.ok) throw new Error(`Failed to fetch blob: ${res.status}`)
    return Buffer.from(await res.arrayBuffer())
  }
  const fs = await import("node:fs/promises")
  return fs.readFile(resolveSafePath(fileKey))
}
