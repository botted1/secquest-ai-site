import { NextRequest, NextResponse } from "next/server"
import { analyzeQuestionnaire } from "@/lib/questionnaire-analyzer"

export const maxDuration = 300 // Allow up to 5 minutes for large questionnaires

export async function POST(request: NextRequest) {
  try {
    const { questions } = await request.json()

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: "An array of questions is required" },
        { status: 400 }
      )
    }

    if (questions.length > 100) {
      return NextResponse.json(
        { error: "Maximum 100 questions per request. Please split larger questionnaires." },
        { status: 400 }
      )
    }

    // Process all questions through RAG + Claude
    const results = await analyzeQuestionnaire(questions)

    // Calculate stats
    const stats = {
      total: results.length,
      highConfidence: results.filter(r => r.confidence === "high").length,
      mediumConfidence: results.filter(r => r.confidence === "medium").length,
      lowConfidence: results.filter(r => r.confidence === "low").length,
      needsReview: results.filter(r => r.needsReview).length,
      averageConfidence: Math.round(
        results.reduce((sum, r) => sum + r.confidenceScore, 0) / results.length
      ),
    }

    return NextResponse.json({
      results,
      stats,
      message: `Successfully analyzed ${results.length} questions`,
    })
  } catch (error) {
    console.error("Analyze error:", error)
    return NextResponse.json(
      { error: "Failed to analyze questions. Please check your Bedrock configuration." },
      { status: 500 }
    )
  }
}
