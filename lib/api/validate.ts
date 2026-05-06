import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse }

export async function parseBody<T>(
  req: NextRequest,
  schema: z.ZodType<T>
): Promise<ParseResult<T>> {
  let json: unknown
  try {
    json = await req.json()
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid JSON" }, { status: 400 }),
    }
  }
  const result = schema.safeParse(json)
  if (!result.success) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Invalid request", issues: result.error.issues },
        { status: 400 }
      ),
    }
  }
  return { ok: true, data: result.data }
}
