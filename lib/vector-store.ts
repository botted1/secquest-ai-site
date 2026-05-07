import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import OpenAI from "openai"

const openai = new OpenAI({
  baseURL: "https://integrate.api.nvidia.com/v1",
  apiKey: process.env.NVIDIA_API_KEY,
})

interface VectorNode {
  id: string
  text: string
  embedding: number[]
}

const VECTOR_STORE_FILE = path.join(os.tmpdir(), 'secquest-vectors.json')

/**
 * Generate an embedding for a piece of text using NVIDIA NIM.
 */
export async function generateEmbedding(text: string, isQuery = false): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "nvidia/nv-embedqa-e5-v5",
    input: text,
    // @ts-expect-error - NVIDIA specific kwargs
    input_type: isQuery ? "query" : "passage"
  })
  
  return response.data[0].embedding
}

/**
 * Split text into semantic chunks of roughly roughly the specified length.
 */
export function chunkText(text: string, maxChunkLength = 500): string[] {
  // Simple paragraph splitting first
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0)
  const chunks: string[] = []
  
  let currentChunk = ""
  
  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > maxChunkLength) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.trim())
        currentChunk = ""
      }
      
      // If a single paragraph is still too big, brute force chunk it further
      if (paragraph.length > maxChunkLength) {
        let i = 0
        while (i < paragraph.length) {
          chunks.push(paragraph.slice(i, i + maxChunkLength).trim())
          i += maxChunkLength
        }
      } else {
        currentChunk = paragraph
      }
    } else {
      currentChunk += (currentChunk.length > 0 ? "\n\n" : "") + paragraph
    }
  }
  
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim())
  }
  
  return chunks
}

/**
 * Ingest full document text into the vector store.
 */
export async function injectPolicyDocument(text: string) {
  const chunks = chunkText(text)
  const nodes: VectorNode[] = []
  
  // Create embeddings for each chunk
  for (let i = 0; i < chunks.length; i++) {
    const chunkText = chunks[i]
    if (chunkText.length < 10) continue // Skip extremely short garbage chunks
    
    // Convert to vector
    const embedding = await generateEmbedding(chunkText)
    nodes.push({
      id: `chunk_${i}`,
      text: chunkText,
      embedding
    })
  }
  
  // Save to /tmp
  await fs.writeFile(VECTOR_STORE_FILE, JSON.stringify(nodes))
  return nodes.length
}

/**
 * Cosine similarity between two vectors.
 */
function cosineSimilarity(A: number[], B: number[]) {
  let dotproduct = 0
  let mA = 0
  let mB = 0
  for (let i = 0; i < A.length; i++) {
    dotproduct += (A[i] * B[i])
    mA += (A[i] * A[i])
    mB += (B[i] * B[i])
  }
  mA = Math.sqrt(mA)
  mB = Math.sqrt(mB)
  const similarity = dotproduct / (mA * mB)
  return similarity
}

/**
 * Query the vector store for the closest matching text chunks for a given question.
 */
export async function queryVectorStore(query: string, topK = 3): Promise<Array<{ text: string, score: number }>> {
  try {
    // Check if store exists
    const fileExists = await fs.access(VECTOR_STORE_FILE).then(() => true).catch(() => false)
    if (!fileExists) {
      console.warn("Vector store is empty or does not exist.")
      return []
    }
    
    // Load existing vectors
    const data = await fs.readFile(VECTOR_STORE_FILE, 'utf-8')
    const nodes: VectorNode[] = JSON.parse(data)
    if (nodes.length === 0) return []
    
    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query, true)
    
    // Calculate similarities scoring all nodes
    const scoredNodes = nodes.map(node => ({
      text: node.text,
      score: cosineSimilarity(queryEmbedding, node.embedding)
    }))
    
    // Sort descending by score
    scoredNodes.sort((a, b) => b.score - a.score)
    
    // Return top K
    return scoredNodes.slice(0, topK)
  } catch (err) {
    console.error("Error querying vector store:", err)
    return []
  }
}
