import os from "node:os"
import path from "node:path"
import { z } from "zod"

const FILE_KEY_RE = /^secquest_uploads\/\d+_[a-zA-Z0-9._-]+$/

export const SafeFileKey = z.string().regex(FILE_KEY_RE, "Invalid fileKey format")

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
