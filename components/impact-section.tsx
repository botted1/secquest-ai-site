"use client"

import { motion } from "framer-motion"
import { TrendingUp, Clock, Zap, Target } from "lucide-react"

const impacts = [
  {
    icon: Target,
    stat: "80%",
    label: "Auto-Answered",
    description: "Questions answered automatically with high confidence",
  },
  {
    icon: Clock,
    stat: "30+",
    label: "Hours Saved",
    description: "Per questionnaire compared to manual process",
  },
  {
    icon: Zap,
    stat: "Days → Minutes",
    label: "Turnaround Time",
    description: "Complete questionnaires in a single session",
  },
  {
    icon: TrendingUp,
    stat: "10x",
    label: "Faster Deals",
    description: "Accelerate sales cycles with rapid responses",
  },
]

export function ImpactSection() {
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
            Impact
          </h2>
          <p className="text-3xl sm:text-4xl font-bold text-foreground">
            Measurable <span className="text-primary">results</span>
          </p>
        </motion.div>

        {/* Impact cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {impacts.map((impact, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all text-center">
                <div className="inline-flex p-3 rounded-xl bg-primary/10 text-primary mb-4">
                  <impact.icon className="w-6 h-6" />
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-primary mb-1">
                  {impact.stat}
                </div>
                <div className="text-lg font-semibold text-foreground mb-2">
                  {impact.label}
                </div>
                <p className="text-sm text-muted-foreground">
                  {impact.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
