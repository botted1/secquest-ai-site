"use client"

import { useState, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Upload,
  FileText,
  FileSpreadsheet,
  FileSearch,
  Loader2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Eye,
  RotateCcw,
  Download,
  Copy,
  Filter,
  Sparkles,
  Brain,
  Database,
  CloudUpload,
  X,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

// ─── Types ───────────────────────────────────────────────────────

type AgentState = "idle" | "uploading" | "extracting" | "analyzing" | "complete" | "error"
type ConfidenceFilter = "all" | "high" | "medium" | "low" | "review"

interface QuestionResult {
  id: number
  question: string
  answer: string
  confidence: "high" | "medium" | "low"
  confidenceScore: number
  source: string
  sources: string[]
  needsReview: boolean
}

interface UploadedFile {
  name: string
  size: number
  type: string
  fileKey?: string
}

interface ProcessingStats {
  total: number
  highConfidence: number
  mediumConfidence: number
  lowConfidence: number
  needsReview: number
  averageConfidence: number
}

// ─── Helpers ─────────────────────────────────────────────────────

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const getFileIcon = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase()
  if (ext === "pdf") return <FileText className="w-5 h-5" />
  if (["xlsx", "xls"].includes(ext || "")) return <FileSpreadsheet className="w-5 h-5" />
  return <FileText className="w-5 h-5" />
}

const getFileTypeBadge = (name: string) => {
  const ext = name.split(".").pop()?.toUpperCase()
  return ext || "FILE"
}

const getConfidenceColor = (confidence: "high" | "medium" | "low") => {
  switch (confidence) {
    case "high":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
    case "medium":
      return "bg-amber-500/10 text-amber-400 border-amber-500/30"
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

const getConfidenceBarColor = (confidence: "high" | "medium" | "low") => {
  switch (confidence) {
    case "high":
      return "bg-emerald-500"
    case "medium":
      return "bg-amber-500"
    case "low":
      return "bg-red-500"
  }
}

// ─── Main Component ──────────────────────────────────────────────

export function QuestionnaireAgent() {
  const [state, setState] = useState<AgentState>("idle")
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [progress, setProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState("")
  const [results, setResults] = useState<QuestionResult[]>([])
  const [stats, setStats] = useState<ProcessingStats | null>(null)
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null)
  const [filter, setFilter] = useState<ConfidenceFilter>("all")
  const [errorMessage, setErrorMessage] = useState("")
  const [isDragOver, setIsDragOver] = useState(false)
  const [extractedCount, setExtractedCount] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ─── File Upload & Processing Pipeline ──────────────────────

  const processFile = useCallback(async (file: File) => {
    // Validate file type
    const validExts = [".pdf", ".xlsx", ".xls", ".docx", ".doc"]
    const ext = "." + file.name.split(".").pop()?.toLowerCase()
    if (!validExts.includes(ext)) {
      setErrorMessage("Unsupported file type. Please upload PDF, Excel, or Word documents.")
      setState("error")
      return
    }

    // Validate file size (25MB)
    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage("File too large. Maximum file size is 25MB.")
      setState("error")
      return
    }

    setUploadedFile({ name: file.name, size: file.size, type: file.type })

    try {
      // ── Stage 1: Upload to S3 ──
      setState("uploading")
      setProgress(0)
      setStatusMessage("Uploading document to secure storage...")

      const formData = new FormData()
      formData.append("file", file)

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!uploadRes.ok) {
        const err = await uploadRes.json()
        throw new Error(err.error || "Upload failed")
      }

      const uploadData = await uploadRes.json()
      setProgress(100)
      setUploadedFile((prev) => prev ? { ...prev, fileKey: uploadData.fileKey } : null)

      // ── Stage 2: Extract Questions ──
      setState("extracting")
      setProgress(0)
      setStatusMessage("Analyzing document structure with Amazon Textract...")

      // Simulate progress while waiting for extraction
      const extractProgressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + 2, 90))
      }, 500)

      const extractRes = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileKey: uploadData.fileKey,
          fileName: file.name,
        }),
      })

      clearInterval(extractProgressInterval)

      if (!extractRes.ok) {
        const err = await extractRes.json()
        throw new Error(err.error || "Extraction failed")
      }

      const extractData = await extractRes.json()
      setProgress(100)
      setExtractedCount(extractData.questionCount)
      setStatusMessage(`Extracted ${extractData.questionCount} questions`)

      // Brief pause to show completion
      await new Promise((r) => setTimeout(r, 800))

      // ── Stage 3: Analyze with Bedrock ──
      setState("analyzing")
      setProgress(0)
      setStatusMessage("Searching knowledge base and generating answers...")

      // Simulate progress while waiting for analysis
      const analyzeProgressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + 1, 95))
      }, 800)

      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: extractData.questions }),
      })

      clearInterval(analyzeProgressInterval)

      if (!analyzeRes.ok) {
        const err = await analyzeRes.json()
        throw new Error(err.error || "Analysis failed")
      }

      const analyzeData = await analyzeRes.json()
      setProgress(100)
      setResults(analyzeData.results)
      setStats(analyzeData.stats)

      // Brief pause before showing results
      await new Promise((r) => setTimeout(r, 500))
      setState("complete")
    } catch (err) {
      console.error("Processing error:", err)
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred")
      setState("error")
    }
  }, [])

  // ─── Drag & Drop Handlers ──────────────────────────────────

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  // ─── Reset ─────────────────────────────────────────────────

  const resetAgent = () => {
    setState("idle")
    setUploadedFile(null)
    setProgress(0)
    setStatusMessage("")
    setResults([])
    setStats(null)
    setExpandedQuestion(null)
    setFilter("all")
    setErrorMessage("")
    setExtractedCount(0)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  // ─── Export Functions ──────────────────────────────────────

  const exportAsJSON = () => {
    const data = JSON.stringify({ results, stats }, null, 2)
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `secquest-results-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportAsCSV = () => {
    const headers = ["#", "Question", "Answer", "Confidence", "Score", "Source", "Needs Review"]
    const rows = results.map((r) => [
      r.id,
      `"${r.question.replace(/"/g, '""')}"`,
      `"${r.answer.replace(/"/g, '""')}"`,
      r.confidence,
      r.confidenceScore,
      `"${r.source.replace(/"/g, '""')}"`,
      r.needsReview ? "Yes" : "No",
    ])
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `secquest-results-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyAllToClipboard = () => {
    const text = results
      .map(
        (r) =>
          `Q${r.id}: ${r.question}\nAnswer: ${r.answer}\nConfidence: ${r.confidence} (${r.confidenceScore}%)\nSource: ${r.source}\n`
      )
      .join("\n---\n\n")
    navigator.clipboard.writeText(text)
  }

  // ─── Filtered Results ──────────────────────────────────────

  const filteredResults = results.filter((r) => {
    if (filter === "all") return true
    if (filter === "review") return r.needsReview
    return r.confidence === filter
  })

  // ─── Render ────────────────────────────────────────────────

  return (
    <div className="w-full max-w-5xl mx-auto">
      <AnimatePresence mode="wait">
        {/* ═══ IDLE STATE — Upload Zone ═══ */}
        {state === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="bg-card/40 border-border/50 backdrop-blur-xl overflow-hidden">
              <CardContent className="p-8">
                {/* Drop zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    relative border-2 border-dashed rounded-2xl p-16 cursor-pointer
                    transition-all duration-300 group
                    ${
                      isDragOver
                        ? "border-primary bg-primary/10 scale-[1.02]"
                        : "border-border/60 hover:border-primary/50 hover:bg-primary/5"
                    }
                  `}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.xlsx,.xls,.docx,.doc"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  <div className="text-center">
                    <motion.div
                      animate={isDragOver ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
                      className="mb-6 inline-block"
                    >
                      <div className="relative">
                        <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto group-hover:bg-primary/15 transition-colors">
                          <CloudUpload className="w-10 h-10 text-primary" />
                        </div>
                        <div className="absolute -inset-3 bg-primary/5 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </motion.div>

                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {isDragOver ? "Drop your file here" : "Upload Security Questionnaire"}
                    </h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Drag and drop your security questionnaire document, or click to browse.
                      We&apos;ll extract questions and generate AI-powered answers.
                    </p>

                    {/* Supported formats */}
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                      {[
                        { label: "PDF", icon: "📄" },
                        { label: "Excel", icon: "📊" },
                        { label: "Word", icon: "📝" },
                      ].map((fmt) => (
                        <div
                          key={fmt.label}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/50 rounded-lg text-xs text-muted-foreground"
                        >
                          <span>{fmt.icon}</span>
                          <span>{fmt.label}</span>
                        </div>
                      ))}
                      <span className="text-xs text-muted-foreground/50">Max 25 MB</span>
                    </div>
                  </div>
                </div>

                {/* How it works mini */}
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-4 gap-4">
                  {[
                    { icon: CloudUpload, label: "Upload", desc: "S3 Secure Storage" },
                    { icon: FileSearch, label: "Extract", desc: "Amazon Textract" },
                    { icon: Database, label: "Search", desc: "Bedrock KB" },
                    { icon: Brain, label: "Answer", desc: "NVIDIA NIM" },
                  ].map((step, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border/30"
                    >
                      <div className="p-2 rounded-lg bg-primary/10">
                        <step.icon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-foreground">{step.label}</p>
                        <p className="text-[10px] text-muted-foreground">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ═══ PROCESSING STATES (Upload / Extract / Analyze) ═══ */}
        {(state === "uploading" || state === "extracting" || state === "analyzing") && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="bg-card/40 border-border/50 backdrop-blur-xl overflow-hidden">
              <CardContent className="p-8 sm:p-12">
                {/* File info */}
                {uploadedFile && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border/30 mb-8 max-w-md mx-auto">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      {getFileIcon(uploadedFile.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {uploadedFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(uploadedFile.size)}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {getFileTypeBadge(uploadedFile.name)}
                    </Badge>
                  </div>
                )}

                {/* Processing visualization */}
                <div className="text-center mb-8">
                  <div className="relative w-24 h-24 mx-auto mb-6">
                    {/* Outer ring */}
                    <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                    {/* Spinning ring */}
                    <motion.div
                      className="absolute inset-0 border-4 border-primary border-t-transparent border-r-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                    {/* Inner icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      {state === "uploading" && <CloudUpload className="w-8 h-8 text-primary" />}
                      {state === "extracting" && <FileSearch className="w-8 h-8 text-primary" />}
                      {state === "analyzing" && <Brain className="w-8 h-8 text-primary" />}
                    </div>
                    {/* Glow */}
                    <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl -z-10" />
                  </div>

                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {state === "uploading" && "Uploading to Secure Storage"}
                    {state === "extracting" && "Extracting Questions"}
                    {state === "analyzing" && "Analyzing with Amazon Bedrock"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">{statusMessage}</p>
                </div>

                {/* Progress bar */}
                <div className="max-w-md mx-auto mb-8">
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-right mt-1">{progress}%</p>
                </div>

                {/* Pipeline steps */}
                <div className="max-w-lg mx-auto space-y-3">
                  {[
                    {
                      key: "uploading",
                      label: "Upload to Amazon S3",
                      icon: CloudUpload,
                    },
                    {
                      key: "extracting",
                      label: "Extract with Textract + AI",
                      icon: FileSearch,
                      detail: extractedCount > 0 ? `${extractedCount} questions found` : undefined,
                    },
                    {
                      key: "analyzing",
                      label: "Analyze with Bedrock + NVIDIA NIM",
                      icon: Brain,
                    },
                  ].map((step) => {
                    const stepOrder = ["uploading", "extracting", "analyzing"]
                    const currentIdx = stepOrder.indexOf(state)
                    const stepIdx = stepOrder.indexOf(step.key)
                    const isComplete = stepIdx < currentIdx
                    const isCurrent = stepIdx === currentIdx
                    const isPending = stepIdx > currentIdx

                    return (
                      <div
                        key={step.key}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                          isCurrent
                            ? "bg-primary/10 border border-primary/30"
                            : isComplete
                            ? "bg-emerald-500/5 border border-emerald-500/20"
                            : "bg-secondary/20 border border-border/20 opacity-50"
                        }`}
                      >
                        <div
                          className={`p-2 rounded-lg ${
                            isComplete
                              ? "bg-emerald-500/20"
                              : isCurrent
                              ? "bg-primary/20"
                              : "bg-secondary/30"
                          }`}
                        >
                          {isComplete ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : isCurrent ? (
                            <Loader2 className="w-4 h-4 text-primary animate-spin" />
                          ) : (
                            <step.icon className={`w-4 h-4 ${isPending ? "text-muted-foreground" : "text-primary"}`} />
                          )}
                        </div>
                        <div className="flex-1">
                          <p
                            className={`text-sm font-medium ${
                              isComplete
                                ? "text-emerald-400"
                                : isCurrent
                                ? "text-foreground"
                                : "text-muted-foreground"
                            }`}
                          >
                            {step.label}
                          </p>
                          {step.detail && isComplete && (
                            <p className="text-xs text-emerald-400/70">{step.detail}</p>
                          )}
                        </div>
                        {isComplete && (
                          <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                            Done
                          </Badge>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ═══ ERROR STATE ═══ */}
        {state === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="bg-card/40 border-border/50 backdrop-blur-xl">
              <CardContent className="p-8 sm:p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Processing Failed</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                  {errorMessage}
                </p>
                <Button onClick={resetAgent} className="glow-cyan">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ═══ COMPLETE STATE — Results Dashboard ═══ */}
        {state === "complete" && stats && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            {/* Stats Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
              {[
                {
                  label: "Total Questions",
                  value: stats.total,
                  color: "text-foreground",
                  bg: "bg-secondary/40",
                  border: "border-border/40",
                },
                {
                  label: "High Confidence",
                  value: stats.highConfidence,
                  color: "text-emerald-400",
                  bg: "bg-emerald-500/10",
                  border: "border-emerald-500/20",
                },
                {
                  label: "Medium",
                  value: stats.mediumConfidence,
                  color: "text-amber-400",
                  bg: "bg-amber-500/10",
                  border: "border-amber-500/20",
                },
                {
                  label: "Low",
                  value: stats.lowConfidence,
                  color: "text-red-400",
                  bg: "bg-red-500/10",
                  border: "border-red-500/20",
                },
                {
                  label: "Needs Review",
                  value: stats.needsReview,
                  color: "text-amber-400",
                  bg: "bg-amber-500/10",
                  border: "border-amber-500/20",
                },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`${stat.bg} ${stat.border} border rounded-xl p-4 text-center backdrop-blur-sm`}
                >
                  <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Toolbar */}
            <Card className="bg-card/40 border-border/50 backdrop-blur-xl mb-4">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  {/* Filters */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    {(
                      [
                        { key: "all", label: "All" },
                        { key: "high", label: "High" },
                        { key: "medium", label: "Medium" },
                        { key: "low", label: "Low" },
                        { key: "review", label: "Needs Review" },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          filter === f.key
                            ? "bg-primary/20 text-primary border border-primary/30"
                            : "bg-secondary/30 text-muted-foreground hover:text-foreground border border-transparent"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={exportAsCSV}>
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                      CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportAsJSON}>
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                      JSON
                    </Button>
                    <Button variant="outline" size="sm" onClick={copyAllToClipboard}>
                      <Copy className="w-3.5 h-3.5 mr-1.5" />
                      Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={resetAgent}>
                      <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                      New
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results List */}
            <div className="space-y-3">
              {filteredResults.map((result, index) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card className="bg-card/30 border-border/40 backdrop-blur-sm hover:border-primary/20 transition-all overflow-hidden">
                    {/* Question Header */}
                    <div
                      className="p-4 cursor-pointer flex items-start justify-between gap-4"
                      onClick={() =>
                        setExpandedQuestion(expandedQuestion === result.id ? null : result.id)
                      }
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-xs font-mono text-muted-foreground/70">
                            Q{result.id}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${getConfidenceColor(result.confidence)}`}
                          >
                            {getConfidenceIcon(result.confidence)}
                            <span className="ml-1 capitalize">{result.confidence}</span>
                            <span className="ml-1 opacity-70">{result.confidenceScore}%</span>
                          </Badge>
                          {result.needsReview && (
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/30"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Review
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium text-foreground leading-relaxed">
                          {result.question}
                        </p>
                      </div>

                      {/* Confidence bar + expand */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="hidden sm:block w-16">
                          <div className="w-full h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${getConfidenceBarColor(
                                result.confidence
                              )}`}
                              style={{ width: `${result.confidenceScore}%` }}
                            />
                          </div>
                        </div>
                        {expandedQuestion === result.id ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Answer */}
                    <AnimatePresence>
                      {expandedQuestion === result.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-0 border-t border-border/30">
                            <div className="mt-4">
                              <div className="flex items-center gap-2 mb-3">
                                <Sparkles className="w-3.5 h-3.5 text-primary" />
                                <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                                  AI-Generated Answer
                                </span>
                              </div>
                              <p className="text-sm text-foreground/90 leading-relaxed mb-4 pl-0.5">
                                {result.answer}
                              </p>

                              {/* Sources */}
                              <div className="space-y-1.5">
                                {result.sources.length > 0 ? (
                                  result.sources.map((src, si) => (
                                    <div
                                      key={si}
                                      className="flex items-center gap-2 text-xs text-muted-foreground"
                                    >
                                      <ExternalLink className="w-3 h-3 shrink-0" />
                                      <span className="truncate">{src}</span>
                                    </div>
                                  ))
                                ) : (
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <ExternalLink className="w-3 h-3" />
                                    <span>{result.source}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Empty filter state */}
            {filteredResults.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No questions match the selected filter.
                </p>
              </div>
            )}

            {/* Summary */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6"
            >
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-primary mb-1">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold">Analysis Complete</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {stats.highConfidence} of {stats.total} questions answered with high confidence.
                    {stats.needsReview > 0 &&
                      ` ${stats.needsReview} questions flagged for human review.`}
                    {" "}Average confidence: {stats.averageConfidence}%.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
