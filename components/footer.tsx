"use client"

import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"

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
          {/* Logo - consistent with navbar */}
          <div className="flex items-center gap-2.5">
            <svg 
              viewBox="0 0 32 32" 
              className="h-7 w-7"
              fill="none"
            >
              <defs>
                <linearGradient id="footerLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="oklch(0.78 0.15 195)" />
                  <stop offset="100%" stopColor="oklch(0.65 0.12 200)" />
                </linearGradient>
              </defs>
              <path 
                d="M16 2L28 8V16C28 22.627 22.627 28 16 28C9.373 28 4 22.627 4 16V8L16 2Z"
                stroke="url(#footerLogoGradient)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <path 
                d="M12 11C12 11 13 10 16 10C19 10 20 11.5 20 13C20 15 18 15.5 16 16C14 16.5 12 17 12 19C12 20.5 13 22 16 22C19 22 20 21 20 21"
                stroke="url(#footerLogoGradient)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <circle 
                cx="22" 
                cy="10" 
                r="2" 
                fill="url(#footerLogoGradient)"
              />
            </svg>
            <div className="flex items-baseline gap-0.5">
              <span className="text-lg font-bold tracking-tight text-foreground">Sec</span>
              <span className="text-lg font-bold tracking-tight text-primary">Quest</span>
            </div>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-semibold px-1.5 py-0">
              AI
            </Badge>
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
