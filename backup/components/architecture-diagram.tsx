"use client"

import { motion } from "framer-motion"
import { 
  FileText, 
  Database, 
  Brain, 
  ArrowRight, 
  Cloud,
  HardDrive
} from "lucide-react"

const architectureNodes = [
  {
    id: "input",
    icon: FileText,
    label: "Questionnaire",
    sublabel: "PDF/Excel/Word",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
  },
  {
    id: "s3",
    icon: HardDrive,
    label: "Amazon S3",
    sublabel: "Document Storage",
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/30",
  },
  {
    id: "textract",
    icon: FileText,
    label: "Amazon Textract",
    sublabel: "OCR & Extraction",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
  },
  {
    id: "kb",
    icon: Database,
    label: "Bedrock KB",
    sublabel: "Knowledge Bases",
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
  },
  {
    id: "bedrock",
    icon: Brain,
    label: "Bedrock Claude 3",
    sublabel: "Answer Generation",
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/30",
  },
  {
    id: "output",
    icon: Cloud,
    label: "Completed",
    sublabel: "With Confidence",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/30",
  },
]

export function ArchitectureDiagram() {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
            Architecture
          </h2>
          <p className="text-3xl sm:text-4xl font-bold text-foreground">
            Built on <span className="text-primary">AWS</span>
          </p>
        </motion.div>

        {/* Architecture flow */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative"
        >
          {/* Desktop grid layout */}
          <div className="hidden lg:grid grid-cols-6 gap-4 items-center">
            {architectureNodes.map((node, index) => (
              <div key={node.id} className="flex items-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className={`flex-1 p-4 rounded-xl border ${node.borderColor} ${node.bgColor} backdrop-blur-sm text-center hover:scale-105 transition-transform`}
                >
                  <node.icon className={`w-10 h-10 mx-auto mb-3 ${node.color}`} />
                  <h4 className="text-sm font-semibold text-foreground">{node.label}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{node.sublabel}</p>
                </motion.div>
                {index < architectureNodes.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
                    className="mx-2"
                  >
                    <ArrowRight className="w-5 h-5 text-primary/50" />
                  </motion.div>
                )}
              </div>
            ))}
          </div>

          {/* Mobile/tablet vertical layout */}
          <div className="lg:hidden space-y-4">
            {architectureNodes.map((node, index) => (
              <div key={node.id}>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className={`p-4 rounded-xl border ${node.borderColor} ${node.bgColor} backdrop-blur-sm flex items-center gap-4`}
                >
                  <node.icon className={`w-10 h-10 ${node.color} shrink-0`} />
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{node.label}</h4>
                    <p className="text-xs text-muted-foreground">{node.sublabel}</p>
                  </div>
                </motion.div>
                {index < architectureNodes.length - 1 && (
                  <div className="flex justify-center my-2">
                    <ArrowRight className="w-5 h-5 text-primary/50 rotate-90" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* AWS branding */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-muted-foreground">
            Powered by{" "}
            <span className="text-orange-400 font-semibold">Amazon Web Services</span>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
