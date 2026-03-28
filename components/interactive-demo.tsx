"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Upload, 
  FileText, 
  Loader2, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  ExternalLink,
  Eye,
  RotateCcw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

type DemoState = "idle" | "uploading" | "processing" | "complete"

interface QuestionResult {
  id: number
  question: string
  answer: string
  confidence: "high" | "medium" | "low"
  source: string
  needsReview: boolean
}

const sampleResults: QuestionResult[] = [
  {
    id: 1,
    question: "Does your organization have a documented information security policy?",
    answer: "Yes. Our organization maintains a comprehensive Information Security Policy (ISP-001) that is reviewed annually by the CISO and approved by executive leadership. The policy covers data classification, access controls, incident response, and compliance requirements.",
    confidence: "high",
    source: "Information Security Policy v3.2, Section 1.1",
    needsReview: false,
  },
  {
    id: 2,
    question: "How do you handle encryption of data at rest?",
    answer: "All data at rest is encrypted using AES-256 encryption. Database encryption is managed through AWS KMS with automatic key rotation every 365 days. Backup data is encrypted using the same standards before transfer to secure storage.",
    confidence: "high",
    source: "Data Encryption Standard, Section 4.2",
    needsReview: false,
  },
  {
    id: 3,
    question: "What is your incident response time for critical security events?",
    answer: "Critical security incidents are acknowledged within 15 minutes and initial response begins within 1 hour. Our Security Operations Center operates 24/7 with defined escalation procedures.",
    confidence: "medium",
    source: "Incident Response Plan, Section 3.1",
    needsReview: true,
  },
  {
    id: 4,
    question: "Do you perform regular penetration testing?",
    answer: "Yes, we conduct annual third-party penetration testing through certified vendors. Additionally, quarterly vulnerability assessments are performed internally using industry-standard tools.",
    confidence: "high",
    source: "Security Assessment Policy, Section 2.4",
    needsReview: false,
  },
  {
    id: 5,
    question: "What certifications does your organization hold?",
    answer: "Our organization maintains SOC 2 Type II, ISO 27001, and GDPR compliance certifications. Annual audits are conducted by independent third-party auditors.",
    confidence: "medium",
    source: "Compliance Overview Document",
    needsReview: true,
  },
  {
    id: 6,
    question: "How do you manage third-party vendor security?",
    answer: "All vendors undergo security assessment before onboarding. Critical vendors are reviewed annually using our Vendor Security Questionnaire. Contracts include security requirements and right-to-audit clauses.",
    confidence: "high",
    source: "Vendor Management Policy, Section 5.1",
    needsReview: false,
  },
  {
    id: 7,
    question: "Describe your employee security awareness training program.",
    answer: "All employees complete mandatory security awareness training upon hire and annually thereafter. Training covers phishing, social engineering, data handling, and incident reporting. Completion is tracked and reported to management.",
    confidence: "high",
    source: "Security Training Policy, Section 2.2",
    needsReview: false,
  },
  {
    id: 8,
    question: "What is your data retention policy for customer data?",
    answer: "Customer data is retained for the duration of the service agreement plus 90 days. Upon request or contract termination, data can be exported and/or securely deleted with certification provided.",
    confidence: "low",
    source: "Data Retention Schedule (partial match)",
    needsReview: true,
  },
]

const getConfidenceColor = (confidence: "high" | "medium" | "low") => {
  switch (confidence) {
    case "high":
      return "bg-green-500/10 text-green-400 border-green-500/30"
    case "medium":
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
    case "low":
      return "bg-red-500/10 text-red-400 border-red-500/30"
  }
}

const getConfidenceIcon = (confidence: "high" | "medium" | "low") => {
  switch (confidence) {
    case "high":
      return <CheckCircle className="w-4 h-4" />
    case "medium":
      return <AlertTriangle className="w-4 h-4" />
    case "low":
      return <XCircle className="w-4 h-4" />
  }
}

export function InteractiveDemo() {
  const [state, setState] = useState<DemoState>("idle")
  const [progress, setProgress] = useState(0)
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null)

  const handleUpload = () => {
    setState("uploading")
    setProgress(0)
    
    // Simulate upload
    const uploadInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(uploadInterval)
          setState("processing")
          simulateProcessing()
          return 100
        }
        return prev + 20
      })
    }, 200)
  }

  const simulateProcessing = () => {
    setProgress(0)
    const processInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(processInterval)
          setState("complete")
          return 100
        }
        return prev + 5
      })
    }, 100)
  }

  const resetDemo = () => {
    setState("idle")
    setProgress(0)
    setExpandedQuestion(null)
  }

  const stats = {
    total: sampleResults.length,
    highConfidence: sampleResults.filter((r) => r.confidence === "high").length,
    needsReview: sampleResults.filter((r) => r.needsReview).length,
  }

  return (
    <section id="demo" className="relative py-24 overflow-hidden scroll-mt-20">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/10 to-background" />
      
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
            Interactive Demo
          </h2>
          <p className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            See it in <span className="text-primary">action</span>
          </p>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Try our mock demo to see how SecQuest AI processes security questionnaires
            and generates answers with confidence scoring.
          </p>
        </motion.div>

        {/* Demo Container */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="bg-card/50 border-border/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="border-b border-border/50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Questionnaire Processor
                </CardTitle>
                {state === "complete" && (
                  <Button variant="outline" size="sm" onClick={resetDemo}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset Demo
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <AnimatePresence mode="wait">
                {/* Idle State - Upload */}
                {state === "idle" && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-12"
                  >
                    <div 
                      onClick={handleUpload}
                      className="border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-12 cursor-pointer transition-all hover:bg-primary/5 group"
                    >
                      <Upload className="w-16 h-16 mx-auto text-muted-foreground group-hover:text-primary transition-colors mb-4" />
                      <p className="text-lg font-medium text-foreground mb-2">
                        Click to upload a questionnaire
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Supports PDF, Excel, Word (Demo uses sample data)
                      </p>
                    </div>
                    <Button onClick={handleUpload} size="lg" className="mt-6 glow-cyan">
                      <Upload className="w-4 h-4 mr-2" />
                      Start Demo with Sample File
                    </Button>
                  </motion.div>
                )}

                {/* Uploading State */}
                {state === "uploading" && (
                  <motion.div
                    key="uploading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-12"
                  >
                    <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin mb-4" />
                    <p className="text-lg font-medium text-foreground mb-4">
                      Uploading questionnaire...
                    </p>
                    <Progress value={progress} className="max-w-md mx-auto h-2" />
                    <p className="text-sm text-muted-foreground mt-2">
                      {progress}% complete
                    </p>
                  </motion.div>
                )}

                {/* Processing State */}
                {state === "processing" && (
                  <motion.div
                    key="processing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-12"
                  >
                    <div className="relative w-20 h-20 mx-auto mb-4">
                      <div className="absolute inset-0 border-4 border-primary/30 rounded-full" />
                      <div 
                        className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"
                        style={{ animationDuration: "1s" }}
                      />
                      <FileSearch className="absolute inset-0 m-auto w-8 h-8 text-primary" />
                    </div>
                    <p className="text-lg font-medium text-foreground mb-2">
                      Processing with Amazon Bedrock...
                    </p>
                    <div className="space-y-2 text-sm text-muted-foreground max-w-md mx-auto">
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: progress > 20 ? 1 : 0.3 }}
                      >
                        {progress > 20 ? "✓" : "○"} Extracting questions with Textract
                      </motion.p>
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: progress > 50 ? 1 : 0.3 }}
                      >
                        {progress > 50 ? "✓" : "○"} Searching knowledge base for context
                      </motion.p>
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: progress > 80 ? 1 : 0.3 }}
                      >
                        {progress > 80 ? "✓" : "○"} Generating answers with Claude 3
                      </motion.p>
                    </div>
                    <Progress value={progress} className="max-w-md mx-auto h-2 mt-4" />
                  </motion.div>
                )}

                {/* Complete State - Results */}
                {state === "complete" && (
                  <motion.div
                    key="complete"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {/* Stats bar */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-secondary/50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-foreground">{stats.total}</div>
                        <div className="text-xs text-muted-foreground">Questions Processed</div>
                      </div>
                      <div className="bg-green-500/10 rounded-lg p-4 text-center border border-green-500/20">
                        <div className="text-2xl font-bold text-green-400">{stats.highConfidence}</div>
                        <div className="text-xs text-green-400/80">High Confidence</div>
                      </div>
                      <div className="bg-yellow-500/10 rounded-lg p-4 text-center border border-yellow-500/20">
                        <div className="text-2xl font-bold text-yellow-400">{stats.needsReview}</div>
                        <div className="text-xs text-yellow-400/80">Needs Review</div>
                      </div>
                    </div>

                    {/* Results list */}
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                      {sampleResults.map((result, index) => (
                        <motion.div
                          key={result.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border border-border/50 rounded-lg overflow-hidden hover:border-primary/30 transition-all"
                        >
                          {/* Question header */}
                          <div 
                            className="p-4 bg-secondary/30 cursor-pointer flex items-start justify-between gap-4"
                            onClick={() => setExpandedQuestion(
                              expandedQuestion === result.id ? null : result.id
                            )}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-mono text-muted-foreground">
                                  Q{result.id}
                                </span>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${getConfidenceColor(result.confidence)}`}
                                >
                                  {getConfidenceIcon(result.confidence)}
                                  <span className="ml-1 capitalize">{result.confidence}</span>
                                </Badge>
                                {result.needsReview && (
                                  <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                                    <Eye className="w-3 h-3 mr-1" />
                                    Needs Review
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm font-medium text-foreground">
                                {result.question}
                              </p>
                            </div>
                            <Button variant="ghost" size="sm" className="shrink-0">
                              {expandedQuestion === result.id ? "Hide" : "Show"}
                            </Button>
                          </div>

                          {/* Answer (expandable) */}
                          <AnimatePresence>
                            {expandedQuestion === result.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="p-4 border-t border-border/50 bg-card/50">
                                  <div className="mb-3">
                                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                                      AI-Generated Answer
                                    </span>
                                  </div>
                                  <p className="text-sm text-foreground leading-relaxed mb-4">
                                    {result.answer}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <ExternalLink className="w-3 h-3" />
                                    <span>Source: {result.source}</span>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))}
                    </div>

                    {/* Summary */}
                    <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
                      <div className="flex items-center gap-2 text-primary">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-semibold">Processing Complete</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {stats.highConfidence} of {stats.total} questions answered with high confidence. 
                        {stats.needsReview} questions flagged for human review.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}
