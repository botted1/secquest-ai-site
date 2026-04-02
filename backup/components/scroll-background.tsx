"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform, useSpring } from "framer-motion"

export function ScrollBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  
  const { scrollYProgress } = useScroll()
  
  // Smooth spring animation for scroll
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  // Transform values for different elements
  const rotate1 = useTransform(smoothProgress, [0, 1], [0, 180])
  const rotate2 = useTransform(smoothProgress, [0, 1], [0, -120])
  const rotate3 = useTransform(smoothProgress, [0, 1], [0, 90])
  
  const y1 = useTransform(smoothProgress, [0, 1], [0, -300])
  const y2 = useTransform(smoothProgress, [0, 1], [0, -200])
  const y3 = useTransform(smoothProgress, [0, 1], [0, -400])
  
  const scale1 = useTransform(smoothProgress, [0, 0.5, 1], [1, 1.2, 0.8])
  const scale2 = useTransform(smoothProgress, [0, 0.5, 1], [0.8, 1, 1.2])
  
  const opacity1 = useTransform(smoothProgress, [0, 0.3, 0.7, 1], [0.15, 0.25, 0.2, 0.1])
  const opacity2 = useTransform(smoothProgress, [0, 0.5, 1], [0.1, 0.2, 0.15])

  return (
    <div ref={containerRef} className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Base grid that fades with scroll */}
      <motion.div 
        className="absolute inset-0 bg-grid"
        style={{ opacity: useTransform(smoothProgress, [0, 0.5], [0.4, 0.15]) }}
      />

      {/* Large geometric shape - top right */}
      <motion.div
        className="absolute -top-20 -right-20 w-[600px] h-[600px]"
        style={{ 
          y: y1, 
          rotate: rotate1,
          scale: scale1,
          opacity: opacity1
        }}
      >
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="oklch(0.78 0.15 195)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="oklch(0.65 0.12 200)" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          {/* Hexagonal shield shape */}
          <path
            d="M100 10 L180 50 L180 130 L100 190 L20 130 L20 50 Z"
            fill="none"
            stroke="url(#grad1)"
            strokeWidth="0.5"
          />
          <path
            d="M100 30 L160 60 L160 120 L100 170 L40 120 L40 60 Z"
            fill="none"
            stroke="url(#grad1)"
            strokeWidth="0.3"
          />
          <path
            d="M100 50 L140 70 L140 110 L100 150 L60 110 L60 70 Z"
            fill="none"
            stroke="url(#grad1)"
            strokeWidth="0.2"
          />
        </svg>
      </motion.div>

      {/* Circuit lines - left side */}
      <motion.div
        className="absolute top-1/4 -left-10 w-[400px] h-[800px]"
        style={{ 
          y: y2,
          opacity: opacity2
        }}
      >
        <svg viewBox="0 0 100 200" className="w-full h-full">
          <defs>
            <linearGradient id="grad2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="oklch(0.78 0.15 195)" stopOpacity="0" />
              <stop offset="50%" stopColor="oklch(0.78 0.15 195)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="oklch(0.78 0.15 195)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Vertical circuit lines */}
          <path d="M20 0 L20 60 L40 80 L40 120 L20 140 L20 200" fill="none" stroke="url(#grad2)" strokeWidth="0.3" />
          <path d="M50 0 L50 40 L70 60 L70 140 L50 160 L50 200" fill="none" stroke="url(#grad2)" strokeWidth="0.2" />
          <path d="M80 0 L80 80 L60 100 L60 100 L80 120 L80 200" fill="none" stroke="url(#grad2)" strokeWidth="0.3" />
          {/* Connection nodes */}
          <circle cx="40" cy="80" r="2" fill="oklch(0.78 0.15 195)" fillOpacity="0.3" />
          <circle cx="70" cy="60" r="1.5" fill="oklch(0.78 0.15 195)" fillOpacity="0.25" />
          <circle cx="60" cy="100" r="2" fill="oklch(0.78 0.15 195)" fillOpacity="0.3" />
          <circle cx="20" cy="140" r="1.5" fill="oklch(0.78 0.15 195)" fillOpacity="0.25" />
        </svg>
      </motion.div>

      {/* Floating orb - center right */}
      <motion.div
        className="absolute top-1/2 right-1/4 w-64 h-64"
        style={{ 
          y: y3,
          rotate: rotate2,
          scale: scale2
        }}
      >
        <div className="relative w-full h-full">
          <div className="absolute inset-0 rounded-full bg-primary/10 blur-3xl" />
          <svg viewBox="0 0 100 100" className="w-full h-full opacity-20">
            <defs>
              <radialGradient id="orbGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="oklch(0.78 0.15 195)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="oklch(0.78 0.15 195)" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="45" fill="none" stroke="url(#orbGrad)" strokeWidth="0.5" />
            <circle cx="50" cy="50" r="35" fill="none" stroke="url(#orbGrad)" strokeWidth="0.3" />
            <circle cx="50" cy="50" r="25" fill="none" stroke="url(#orbGrad)" strokeWidth="0.2" />
          </svg>
        </div>
      </motion.div>

      {/* Data flow lines - bottom */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-[300px]"
        style={{ 
          opacity: useTransform(smoothProgress, [0.5, 1], [0.1, 0.3])
        }}
      >
        <svg viewBox="0 0 1000 150" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="oklch(0.78 0.15 195)" stopOpacity="0" />
              <stop offset="50%" stopColor="oklch(0.78 0.15 195)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="oklch(0.78 0.15 195)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.path
            d="M0 100 Q250 50, 500 100 T1000 100"
            fill="none"
            stroke="url(#flowGrad)"
            strokeWidth="0.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
          <motion.path
            d="M0 120 Q250 70, 500 120 T1000 120"
            fill="none"
            stroke="url(#flowGrad)"
            strokeWidth="0.3"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2.5, ease: "easeInOut", delay: 0.3 }}
          />
        </svg>
      </motion.div>

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-primary/30"
          style={{
            left: `${15 + i * 15}%`,
            top: `${20 + (i % 3) * 25}%`,
            y: useTransform(smoothProgress, [0, 1], [0, -100 - i * 30]),
            opacity: useTransform(smoothProgress, [0, 0.5, 1], [0.2, 0.4, 0.1]),
            scale: useTransform(smoothProgress, [0, 0.5, 1], [1, 1.5, 0.5])
          }}
        />
      ))}

      {/* Rotating ring - bottom left */}
      <motion.div
        className="absolute bottom-1/4 left-1/6 w-48 h-48"
        style={{ 
          rotate: rotate3,
          opacity: opacity2
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="oklch(0.78 0.15 195)" stopOpacity="0.2" />
              <stop offset="100%" stopColor="oklch(0.65 0.12 200)" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="40" fill="none" stroke="url(#ringGrad)" strokeWidth="0.5" strokeDasharray="5 10" />
          <circle cx="50" cy="50" r="30" fill="none" stroke="url(#ringGrad)" strokeWidth="0.3" strokeDasharray="3 8" />
        </svg>
      </motion.div>

      {/* Scan line effect */}
      <motion.div
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"
        style={{
          top: useTransform(smoothProgress, [0, 1], ["10%", "90%"])
        }}
      />
    </div>
  )
}
