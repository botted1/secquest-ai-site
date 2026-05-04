import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { Session } from "next-auth"

export type AuthGuardResult =
  | { ok: true; session: Session }
  | { ok: false; response: NextResponse }

export async function requireAuth(): Promise<AuthGuardResult> {
  const session = await auth()
  if (!session?.user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }
  return { ok: true, session }
}
