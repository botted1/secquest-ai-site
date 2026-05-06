import { S3Client } from "@aws-sdk/client-s3"
import { TextractClient } from "@aws-sdk/client-textract"
import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime"
import { BedrockAgentRuntimeClient } from "@aws-sdk/client-bedrock-agent-runtime"

const awsConfig = {
  region: process.env.AWS_REGION || "ap-southeast-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
}

// Lazy singleton pattern — clients are only created when first accessed
let _s3Client: S3Client | null = null
let _textractClient: TextractClient | null = null
let _bedrockClient: BedrockRuntimeClient | null = null
let _bedrockAgentClient: BedrockAgentRuntimeClient | null = null

export function getS3Client(): S3Client {
  if (!_s3Client) {
    _s3Client = new S3Client(awsConfig)
  }
  return _s3Client
}

export function getTextractClient(): TextractClient {
  if (!_textractClient) {
    _textractClient = new TextractClient(awsConfig)
  }
  return _textractClient
}

export function getBedrockClient(): BedrockRuntimeClient {
  if (!_bedrockClient) {
    _bedrockClient = new BedrockRuntimeClient(awsConfig)
  }
  return _bedrockClient
}

export function getBedrockAgentClient(): BedrockAgentRuntimeClient {
  if (!_bedrockAgentClient) {
    _bedrockAgentClient = new BedrockAgentRuntimeClient(awsConfig)
  }
  return _bedrockAgentClient
}

export const S3_BUCKET = process.env.S3_BUCKET_NAME || "secquest-ai-uploads"
export const BEDROCK_KB_ID = process.env.BEDROCK_KNOWLEDGE_BASE_ID || ""
export const BEDROCK_MODEL_ID = process.env.BEDROCK_MODEL_ID || "anthropic.claude-3-sonnet-20240229-v1:0"
