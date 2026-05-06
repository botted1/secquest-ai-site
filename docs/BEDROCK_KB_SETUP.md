# Amazon Bedrock Knowledge Base Setup Guide

This guide walks you through setting up the Amazon Bedrock Knowledge Base (KB)
for SecQuest AI. This KB stores your organization's security policies, SOC2
documents, ISO 27001 documentation, and more — enabling our RAG pipeline to
find relevant context when answering security questionnaire questions.

---

## Prerequisites

- AWS Account with Bedrock access enabled in **ap-southeast-2 (Sydney)**
- Claude 3 Sonnet model access enabled in Bedrock
- Your security policy documents (PDF, Word, or text files)

---

## Step 1: Enable Bedrock Model Access

1. Go to **Amazon Bedrock** in the AWS Console (ap-southeast-2)
2. Click **Model access** in the left sidebar
3. Click **Manage model access**
4. Enable **Anthropic → Claude 3 Sonnet** (and optionally Claude 3 Haiku for faster/cheaper inference)
5. Submit and wait for access to be granted (usually instant)

---

## Step 2: Create an S3 Bucket for Knowledge Base Documents

1. Go to **Amazon S3** → **Create bucket**
2. Name: `secquest-kb-documents` (or your preferred name)
3. Region: `ap-southeast-2`
4. Leave defaults, click **Create bucket**
5. Upload your security policy documents into this bucket:
   - Information Security Policy
   - Data Encryption Standards
   - Incident Response Plan
   - Access Control Policy
   - Vendor Management Policy
   - Compliance Certifications (SOC2, ISO 27001, etc.)
   - Privacy Policy / GDPR docs
   - Security Training Policy
   - Data Retention Policy
   - Any other security-relevant documents

---

## Step 3: Create an S3 Bucket for File Uploads

This is the bucket where user-uploaded questionnaires will be stored.

1. Go to **Amazon S3** → **Create bucket**
2. Name: `secquest-ai-uploads`
3. Region: `ap-southeast-2`
4. Leave defaults, click **Create bucket**
5. Copy this bucket name to `.env.local` as `S3_BUCKET_NAME`

---

## Step 4: Create the Bedrock Knowledge Base

1. Go to **Amazon Bedrock** → **Knowledge bases** (left sidebar, under "Orchestration")
2. Click **Create knowledge base**
3. Configure:
   - **Name**: `SecQuest-Security-Policies`
   - **Description**: `Security policy documents for automated questionnaire answering`
   - **IAM role**: Create a new service role (let AWS create it)
4. **Data source**:
   - Source type: **Amazon S3**
   - S3 URI: `s3://secquest-kb-documents/` (the bucket from Step 2)
   - Click **Next**
5. **Embeddings model**:
   - Select **Titan Embeddings G1 - Text** (or Titan Embeddings V2)
   - Vector database: **Quick create a new vector store** (uses OpenSearch Serverless)
6. **Review and create** → Click **Create knowledge base**
7. Wait for the KB to be created (takes 2-5 minutes)

---

## Step 5: Sync the Knowledge Base

1. Once the KB is created, click on it
2. Under **Data source**, select your S3 data source
3. Click **Sync** to ingest your documents
4. Wait for sync to complete (varies by document count/size)

---

## Step 6: Copy the Knowledge Base ID

1. On the Knowledge Base detail page, find the **Knowledge base ID**
   - It looks like: `XXXXXXXXXX` (alphanumeric)
2. Copy it to your `.env.local` file:
   ```
   BEDROCK_KNOWLEDGE_BASE_ID=XXXXXXXXXX
   ```

---

## Step 7: Test the Knowledge Base

1. On the KB detail page, click **Test knowledge base** (right panel)
2. Try a sample query: `What is our data encryption policy?`
3. Verify that relevant document chunks are retrieved
4. If results look good, your KB is ready!

---

## Step 8: Configure IAM Permissions

Your AWS IAM user (used in `.env.local`) needs the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::secquest-ai-uploads",
        "arn:aws:s3:::secquest-ai-uploads/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "textract:AnalyzeDocument",
        "textract:DetectDocumentText"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": "arn:aws:bedrock:ap-southeast-2::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0"
    },
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:Retrieve"
      ],
      "Resource": "arn:aws:bedrock:ap-southeast-2:YOUR_ACCOUNT_ID:knowledge-base/YOUR_KB_ID"
    }
  ]
}
```

Replace `YOUR_ACCOUNT_ID` and `YOUR_KB_ID` with your values.

---

## Updating the Knowledge Base

When you add new security policies:

1. Upload new documents to the `secquest-kb-documents` S3 bucket
2. Go to Bedrock → Knowledge Bases → Your KB → Data source
3. Click **Sync** to re-ingest documents
4. New content will be available for RAG queries immediately after sync

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Access denied" when calling Bedrock | Enable model access in Bedrock console and verify IAM permissions |
| KB returns empty results | Verify documents are synced; try broader queries |
| Textract fails on a PDF | Ensure PDF is not password-protected; try re-exporting |
| Low confidence scores | Add more detailed policy documents to the KB |
| Timeout errors | Large questionnaires (50+ questions) may take longer; consider batching |
