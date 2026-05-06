import { z } from "zod"

const Env = z.object({
  NVIDIA_API_KEY: z.string().min(20),
  NVIDIA_BASE_URL: z.string().url().default("https://integrate.api.nvidia.com/v1"),
  ADMIN_USERNAME: z.string().min(1),
  ADMIN_PASSWORD: z.string().min(12),
  AUTH_SECRET: z.string().min(32),
  AWS_REGION: z.string().default("ap-southeast-2"),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
})

const parsed = Env.safeParse(process.env)
if (!parsed.success) {
  const issues = parsed.error.issues.map(i => `  - ${i.path.join(".")}: ${i.message}`).join("\n")
  throw new Error(`Invalid environment configuration:\n${issues}`)
}

export const env = parsed.data
