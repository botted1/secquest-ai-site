"use client"

import { motion } from "framer-motion"
import { Clock, FileStack, TrendingDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const problems = [
  {
    icon: Clock,
    stat: "20-40 hrs",
    title: "Manual Hours Wasted",
    description: "Security teams spend days answering the same questions repeatedly across different questionnaires.",
  },
  {
    icon: FileStack,
    stat: "50+",
    title: "Questionnaires/Year",
    description: "Enterprise companies receive dozens of security assessments annually from prospects and partners.",
  },
  {
    icon: TrendingDown,
    stat: "Weeks",
    title: "Delayed Deals",
    description: "Slow questionnaire responses block sales cycles and cost companies millions in delayed revenue.",
  },
]

export function ProblemSection() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />
      
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
            The Problem
          </h2>
          <p className="text-3xl sm:text-4xl font-bold text-foreground">
            Security questionnaires are a{" "}
            <span className="text-primary">bottleneck</span>
          </p>
        </motion.div>

        {/* Problem cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {problems.map((problem, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full bg-card/50 border-border/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                      <problem.icon className="h-6 w-6" />
                    </div>
                    <div className="text-3xl font-bold text-primary">{problem.stat}</div>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {problem.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {problem.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
