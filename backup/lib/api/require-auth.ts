import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { Session } from "next-auth"

type AuthenticatedSession = Session & { user: NonNullable<Session["user"]> & { id: string } }

export type AuthGuardResult =
  | { ok: true; session: AuthenticatedSession }
  | { ok: false; response: NextResponse }

export async function requireAuth(): Promise<AuthGuardResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }
  return { ok: true, session: session as AuthenticatedSession }
}
