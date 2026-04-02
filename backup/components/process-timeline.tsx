"use client"

import { motion } from "framer-motion"
import { Upload, FileSearch, Brain, CheckCircle } from "lucide-react"

const steps = [
  {
    icon: Upload,
    step: "01",
    title: "Upload Questionnaire",
    description: "Drop any security questionnaire PDF, Excel, or Word document. Our system accepts all common formats.",
    tech: "S3 + Lambda",
  },
  {
    icon: FileSearch,
    step: "02",
    title: "Extract Questions",
    description: "Amazon Textract intelligently parses the document, identifying questions, formatting, and structure.",
    tech: "Amazon Textract",
  },
  {
    icon: Brain,
    step: "03",
    title: "RAG Retrieval",
    description: "Bedrock Knowledge Bases searches your security policies to find relevant context for each question.",
    tech: "Bedrock Knowledge Bases",
  },
  {
    icon: CheckCircle,
    step: "04",
    title: "Generate Answers",
    description: "Claude 3 generates accurate answers with confidence scores and source citations for human review.",
    tech: "Bedrock Claude 3",
  },
]

export function ProcessTimeline() {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-20" />
      
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
            How It Works
          </h2>
          <p className="text-3xl sm:text-4xl font-bold text-foreground">
            Four steps to{" "}
            <span className="text-primary">automation</span>
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Connecting line */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-primary to-primary/50 transform -translate-x-1/2" />

          <div className="space-y-12 lg:space-y-0">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative flex flex-col lg:flex-row items-center gap-8 ${
                  index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                }`}
              >
                {/* Content */}
                <div className={`flex-1 ${index % 2 === 0 ? "lg:text-right" : "lg:text-left"}`}>
                  <div className={`inline-block ${index % 2 === 0 ? "lg:ml-auto" : ""}`}>
                    <div className="bg-card/50 border border-border/50 rounded-xl p-6 backdrop-blur-sm max-w-md hover:border-primary/30 transition-all duration-300">
                      <div className={`flex items-center gap-3 mb-3 ${index % 2 === 0 ? "lg:flex-row-reverse" : ""}`}>
                        <span className="text-4xl font-bold text-primary/30">{step.step}</span>
                        <h3 className="text-xl font-semibold text-foreground">{step.title}</h3>
                      </div>
                      <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                        {step.description}
                      </p>
                      <span className="inline-block text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded">
                        {step.tech}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Icon node */}
                <div className="relative z-10 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-card border-2 border-primary flex items-center justify-center glow-cyan-sm">
                    <step.icon className="w-7 h-7 text-primary" />
                  </div>
                </div>

                {/* Empty space for alternating layout */}
                <div className="flex-1 hidden lg:block" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
