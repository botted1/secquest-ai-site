"use client"

import { Shield } from "lucide-react"
import { motion } from "framer-motion"

export function Footer() {
  return (
    <motion.footer 
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="border-t border-border/50 bg-background/50"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold text-foreground">SecQuest AI</span>
          </div>

          {/* Team */}
          <div className="text-sm text-muted-foreground">
            Presented by <span className="text-primary font-medium">Velocity7</span>
          </div>
        </div>
      </div>
    </motion.footer>
  )
}
