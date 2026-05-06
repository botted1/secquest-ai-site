"use client"

import { useState, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, Database, Loader2, CheckCircle, XCircle, FileText, Server } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function KnowledgeClient({ userName }: { userName: string }) {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")
  const [stats, setStats] = useState<{chunks: number, length: number} | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const processFile = async (file: File) => {
    const validExts = [".pdf", ".docx", ".doc"]
    const ext = "." + file.name.split(".").pop()?.toLowerCase()
    
    if (!validExts.includes(ext)) {
      setError("Please upload a PDF or Word document for policies.")
      return
    }

    if (file.size > 25 * 1024 * 1024) {
      setError("File too large. Maximum size is 25MB.")
      return
    }

    setIsProcessing(true)
    setError("")
    setSuccessMsg("")
    setStats(null)

    try {
      // 1. Upload file locally
      const formData = new FormData()
      formData.append("file", file)
      
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      
      if (!uploadRes.ok) throw new Error((await uploadRes.json()).error || "Upload failed")
      const uploadData = await uploadRes.json()

      // 2. Parse and generate embeddings locally
      const embedRes = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type" : "application/json" },
        body: JSON.stringify({
          fileKey: uploadData.fileKey,
          fileName: file.name
        })
      })

      if (!embedRes.ok) throw new Error((await embedRes.json()).error || "Embedding failed")
      const embedData = await embedRes.json()
      
      setSuccessMsg(`Successfully vectorized ${file.name}`)
      setStats({ chunks: embedData.chunks || 0, length: embedData.rawTextLength || 0 })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Processing failed")
    } finally {
      setIsProcessing(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-12 px-4 sm:px-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10 mix-blend-screen" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[150px] -z-10 mix-blend-screen" />

      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 mb-4 px-3 py-1">
            <Database className="w-3.5 h-3.5 mr-1.5" />
            Local Vector Storage Active
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Knowledge <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">Base</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Upload your company's master security policy. The AI will chunk, embed, and securely store it in local memory to answer future questionnaires.
          </p>
        </div>

        <Card className="bg-card/40 border-border/50 backdrop-blur-xl relative overflow-hidden">
          <CardContent className="p-8 md:p-12">
            {!isProcessing && !successMsg && !error && (
               <div
               onDragOver={handleDragOver}
               onDragLeave={handleDragLeave}
               onDrop={handleDrop}
               onClick={() => fileInputRef.current?.click()}
               className={`
                 relative border-2 border-dashed rounded-2xl p-16 cursor-pointer text-center
                 transition-all tracking-wide duration-300 group
                 ${isDragging ? "border-primary bg-primary/10 scale-[1.02]" : "border-border/60 hover:border-primary/50 hover:bg-primary/5"}
               `}
             >
               <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.doc,.docx" onChange={handleFileChange} />
               <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? "text-primary" : "text-muted-foreground group-hover:text-primary"}`} />
               <h3 className="text-xl font-semibold mb-2">Upload Master Security Policy</h3>
               <p className="text-sm text-muted-foreground max-w-md mx-auto">Drag & drop your PDF or Word document here.</p>
             </div>
            )}

            {isProcessing && (
              <div className="py-20 text-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-6" />
                <h3 className="text-2xl font-semibold mb-2">Vectorizing Policy...</h3>
                <p className="text-muted-foreground">Running embeddings via NVIDIA NIM.</p>
                <p className="text-xs text-muted-foreground/50 mt-4">(This may take ~10 seconds depending on document length)</p>
              </div>
            )}

            {error && (
              <div className="py-16 text-center">
                <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Embedding Failed</h3>
                <p className="text-sm text-destructive/80 mb-6">{error}</p>
                <Button onClick={() => setError("")} variant="outline" className="border-border/50">Try Again</Button>
              </div>
            )}

            {successMsg && (
              <div className="py-16 text-center">
                <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-6" />
                <h3 className="text-2xl font-semibold mb-2 text-emerald-400">Knowledge Base Live</h3>
                <p className="text-foreground mb-6">{successMsg}</p>
                
                {stats && (
                  <div className="flex items-center justify-center gap-4 mb-8">
                    <div className="px-4 py-3 rounded-xl bg-secondary/50 border border-border/50">
                      <div className="text-2xl font-mono text-primary">{stats.chunks}</div>
                      <div className="text-xs font-medium text-muted-foreground">Semantic Chunks</div>
                    </div>
                    <div className="px-4 py-3 rounded-xl bg-secondary/50 border border-border/50">
                      <div className="text-2xl font-mono text-emerald-400">{(stats.length / 1024).toFixed(1)}</div>
                      <div className="text-xs font-medium text-muted-foreground">KB Processed</div>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-center gap-4">
                  <Button asChild className="glow-cyan">
                    <a href="/agent">Go to Agent</a>
                  </Button>
                  <Button onClick={() => {setSuccessMsg(""); setStats(null)}} variant="outline">
                    Update Policy
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
