"use client"

import { motion } from "framer-motion"

const technologies = [
  {
    name: "Next.js",
    category: "Frontend",
    description: "React framework for production",
    color: "from-white/20 to-white/5",
  },
  {
    name: "Tailwind CSS",
    category: "Styling",
    description: "Utility-first CSS framework",
    color: "from-cyan-500/20 to-cyan-500/5",
  },
  {
    name: "Python + boto3",
    category: "Backend",
    description: "AWS SDK for Python",
    color: "from-yellow-500/20 to-yellow-500/5",
  },
  {
    name: "Amazon Bedrock",
    category: "AI/ML",
    description: "Foundation models & RAG",
    color: "from-purple-500/20 to-purple-500/5",
  },
  {
    name: "Amazon Textract",
    category: "Document AI",
    description: "OCR & document extraction",
    color: "from-orange-500/20 to-orange-500/5",
  },
  {
    name: "Claude 3",
    category: "LLM",
    description: "Advanced language model",
    color: "from-amber-500/20 to-amber-500/5",
  },
]

export function TechStack() {
  return (
    <section className="relative py-24 overflow-hidden">
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
            Tech Stack
          </h2>
          <p className="text-3xl sm:text-4xl font-bold text-foreground">
            We <span className="text-primary">use</span>
          </p>
        </motion.div>

        {/* Tech grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {technologies.map((tech, index) => (
            <motion.div
              key={tech.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className={`group relative p-4 rounded-xl border border-border/50 bg-gradient-to-br ${tech.color} backdrop-blur-sm hover:border-primary/30 transition-all hover:scale-105`}
            >
              <div className="text-center">
                <span className="text-[10px] uppercase tracking-wider text-primary/80 font-medium">
                  {tech.category}
                </span>
                <h4 className="text-sm font-semibold text-foreground mt-1 mb-1">
                  {tech.name}
                </h4>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  {tech.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
