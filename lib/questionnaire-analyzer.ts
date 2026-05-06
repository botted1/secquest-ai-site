import { queryVectorStore } from "./vector-store"
import { aiClient } from "./ai-client"

export interface QuestionResult {
  id: number
  question: string
  answer: string
  confidence: "high" | "medium" | "low"
  confidenceScore: number
  source: string
  sources: string[]
  needsReview: boolean
}

interface RetrievedContext {
  text: string
  source: string
  score: number
}

/**
 * Query local vector store to retrieve relevant security policy context
 * for a given question.
 */
export async function retrieveContext(question: string): Promise<RetrievedContext[]> {
  try {
    const results = await queryVectorStore(question, 5) // Get top 5 semantic matches
    
    return results.map(result => ({
      text: result.text,
      source: "Local Security Knowledge Base",
      score: result.score
    }))
  } catch (error) {
    console.error("Error retrieving context from local Knowledge Base:", error)
    return []
  }
}

/**
 * Generate an answer for a security question using Claude 3 with retrieved context.
 */
export async function generateAnswer(
  question: string,
  contexts: RetrievedContext[]
): Promise<{ answer: string; confidenceScore: number; sources: string[] }> {
  const contextText = contexts.length > 0
    ? contexts.map((c, i) => `[Source ${i + 1}: ${c.source}]\n${c.text}`).join("\n\n---\n\n")
    : "No relevant policy documents were found in the knowledge base."

  const prompt = `You are a security compliance expert answering questions for a security questionnaire. Use the provided policy context to generate an accurate, professional answer.

SECURITY QUESTION:
${question}

RELEVANT POLICY CONTEXT:
${contextText}

INSTRUCTIONS:
1. Answer the question directly and professionally based on the provided context
2. If context is available, reference specific policy sections and details
3. If context is limited or not directly relevant, provide a reasonable answer but flag uncertainty
4. Keep the answer concise but comprehensive (2-4 sentences typically)
5. Be specific — avoid vague or generic responses

Respond with a valid JSON object in this exact format:
{
  "answer": "Your detailed answer here",
  "confidence_score": 0.85,
  "reasoning": "Brief explanation of why this confidence level"
}

The confidence_score should be:
- 0.85-1.0 if context directly addresses the question
- 0.60-0.84 if context is partially relevant
- 0.30-0.59 if answer is mostly inferred or context is weak
- 0.0-0.29 if no relevant context was found`

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

    const content = completion.choices[0]?.message?.content || "{}"

    // Parse the JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        answer: parsed.answer || "Unable to generate an answer for this question.",
        confidenceScore: Math.min(1, Math.max(0, parsed.confidence_score || 0)),
        sources: contexts.filter(c => c.score > 0.3).map(c => c.source),
      }
    }

    return {
      answer: content,
      confidenceScore: 0.5,
      sources: contexts.map(c => c.source),
    }
  } catch (error) {
    console.error("Error generating answer:", error)
    throw new Error(`Failed to generate answer for question: ${question.slice(0, 50)}...`)
  }
}

/**
 * Convert a numeric confidence score to a categorical level.
 */
function getConfidenceLevel(score: number): "high" | "medium" | "low" {
  if (score >= 0.75) return "high"
  if (score >= 0.50) return "medium"
  return "low"
}

/**
 * Process an entire questionnaire — retrieve context and generate answers for all questions.
 * This is the main orchestrator function.
 */
export async function analyzeQuestionnaire(
  questions: string[],
  onProgress?: (completed: number, total: number) => void
): Promise<QuestionResult[]> {
  const results: QuestionResult[] = []

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i]

    // Step 1: Retrieve context from Knowledge Base
    const contexts = await retrieveContext(question)

    // Step 2: Generate answer with Claude 3
    const { answer, confidenceScore, sources } = await generateAnswer(question, contexts)

    // Step 3: Determine confidence level and review flag
    const confidence = getConfidenceLevel(confidenceScore)

    results.push({
      id: i + 1,
      question,
      answer,
      confidence,
      confidenceScore: Math.round(confidenceScore * 100),
      source: sources[0] || "No source available",
      sources,
      needsReview: confidence !== "high",
    })

    // Report progress
    if (onProgress) {
      onProgress(i + 1, questions.length)
    }
  }

  return results
}
