"use client"

import { motion } from "framer-motion"
import { Shield, Sparkles } from "lucide-react"
import { QuestionnaireAgent } from "@/components/questionnaire-agent"

interface AgentPageClientProps {
  userName: string
}

export function AgentPageClient({ userName }: AgentPageClientProps) {
  return (
    <div className="pt-16">
      {/* Header */}
      <section className="relative py-12 sm:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-10" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-primary/3 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-primary">
                Welcome back, {userName}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
              Security Questionnaire{" "}
              <span className="text-primary">Agent</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              Upload a security questionnaire and let our AI agent extract questions,
              search your knowledge base, and generate expert answers with confidence scoring via NVIDIA NIM.
            </p>

            {/* Feature chips */}
            <div className="flex items-center gap-2 mt-5 flex-wrap">
              {[
                "Amazon Textract",
                "Bedrock Knowledge Bases",
                "NVIDIA NIM",
                "Nemotron-120B",
                "Confidence Scoring",
              ].map((chip) => (
                <div
                  key={chip}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 border border-primary/20 rounded-full text-xs text-primary/80"
                >
                  <Sparkles className="w-3 h-3" />
                  {chip}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Agent Component */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <QuestionnaireAgent />
          </motion.div>
        </div>
      </section>
    </div>
  )
}
