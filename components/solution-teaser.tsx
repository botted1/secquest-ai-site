"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Bot, Brain, Shield, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

const features = [
  {
    icon: Bot,
    title: "Intelligent Extraction",
    description: "Amazon Textract parses any questionnaire format",
  },
  {
    icon: Brain,
    title: "RAG-Powered Answers",
    description: "Bedrock Knowledge Bases find relevant policies",
  },
  {
    icon: Shield,
    title: "Confidence Scoring",
    description: "Claude evaluates answer quality and flags reviews",
  },
  {
    icon: Zap,
    title: "Instant Results",
    description: "Complete questionnaires in minutes, not days",
  },
]

export function SolutionTeaser() {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
              The Solution
            </h2>
            <p className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
              Let AI handle the{" "}
              <span className="text-primary">heavy lifting</span>
            </p>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              SecQuest AI uses Amazon Bedrock to automatically answer security questionnaires 
              by matching questions to your existing security documentation. Human reviewers 
              only handle edge cases.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                    <feature.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-foreground">{feature.title}</h4>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <Button asChild size="lg" className="glow-cyan">
              <Link href="/how-it-works">
                See How It Works
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>

          {/* Right side - Visual */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-2xl border border-border/50 bg-card/30 p-6 backdrop-blur-sm">
              {/* Fake terminal/output visualization */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/70" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                    <div className="w-3 h-3 rounded-full bg-green-500/70" />
                  </div>
                  <span className="ml-2 font-mono">secquest-ai-demo</span>
                </div>
                
                <div className="space-y-3 font-mono text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-primary">▶</span>
                    <span className="text-muted-foreground">Processing questionnaire...</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-foreground">42 questions extracted</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-foreground">34 auto-answered (81%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-400">!</span>
                    <span className="text-foreground">8 flagged for review</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-primary">⏱</span>
                    <span className="text-muted-foreground">Completed in 3m 47s</span>
                  </div>
                </div>
              </div>

              {/* Glow effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-primary/5 rounded-2xl blur-xl opacity-50 -z-10" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
