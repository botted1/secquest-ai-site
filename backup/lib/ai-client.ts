import OpenAI from "openai"
import { env } from "./env"

export const aiClient = new OpenAI({
  baseURL: env.NVIDIA_BASE_URL,
  apiKey: env.NVIDIA_API_KEY,
})
