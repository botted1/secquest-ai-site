import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { analyzeQuestionnaire } from "@/lib/questionnaire-analyzer"
import { requireAuth } from "@/lib/api/require-auth"
import { rateLimit } from "@/lib/api/rate-limit"
import { parseBody } from "@/lib/api/validate"
import { audit } from "@/lib/api/audit-log"

export const runtime = "nodejs"
export const maxDuration = 300

const AnalyzeSchema = z.object({
  questions: z.array(z.string().min(5).max(2000)).min(1).max(100),
})

export async function POST(req: NextRequest) {
  const guard = await requireAuth()
  if (!guard.ok) return guard.response

  const userId = guard.session.user.id
  // Heavier endpoint — embeddings + LLM loop. 5 calls capacity, refill one every 2 min.
  const limit = rateLimit(`analyze:${userId}`, { capacity: 5, refillPerSec: 1 / 120 })
  if (!limit.ok) {
    audit({ action: "rate_limit.hit", userId, meta: { route: "analyze" } })
    return NextResponse.json(
      { error: "Rate limited" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    )
  }

  const body = await parseBody(req, AnalyzeSchema)
  if (!body.ok) {
    audit({ action: "validation.fail", userId, meta: { route: "analyze" } })
    return body.response
  }

  try {
    const results = await analyzeQuestionnaire(body.data.questions)
    const stats = {
      total: results.length,
      highConfidence: results.filter((r) => r.confidence === "high").length,
      mediumConfidence: results.filter((r) => r.confidence === "medium").length,
      lowConfidence: results.filter((r) => r.confidence === "low").length,
      needsReview: results.filter((r) => r.needsReview).length,
      averageConfidence: Math.round(
        results.reduce((sum, r) => sum + r.confidenceScore, 0) / results.length
      ),
    }

    audit({
      action: "analyze",
      userId,
      meta: { questionCount: body.data.questions.length, averageConfidence: stats.averageConfidence },
    })
    return NextResponse.json({
      results,
      stats,
      message: `Successfully analyzed ${results.length} questions`,
    })
  } catch (error) {
    console.error("Analyze error:", error)
    audit({
      action: "analyze.fail",
      userId,
      meta: {
        questionCount: body.data.questions.length,
        errorClass: error instanceof Error ? error.constructor.name : typeof error,
      },
    })
    return NextResponse.json(
      { error: "Failed to analyze questions. Please check your Bedrock configuration." },
      { status: 500 }
    )
  }
}
