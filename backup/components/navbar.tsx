"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Menu, X, LogOut, Shield, Database } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { useSession, signOut } from "next-auth/react"

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { data: session } = useSession()

  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              {/* Custom minimal logo: Shield outline with integrated checkmark/scan line */}
              <svg 
                viewBox="0 0 32 32" 
                className="h-9 w-9 transition-all duration-300"
                fill="none"
              >
                {/* Glow effect on hover */}
                <defs>
                  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                  <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="oklch(0.78 0.15 195)" />
                    <stop offset="100%" stopColor="oklch(0.65 0.12 200)" />
                  </linearGradient>
                </defs>
                
                {/* Outer shield shape - minimal rounded hexagon */}
                <path 
                  d="M16 2L28 8V16C28 22.627 22.627 28 16 28C9.373 28 4 22.627 4 16V8L16 2Z"
                  stroke="url(#logoGradient)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="group-hover:filter group-hover:[filter:url(#glow)] transition-all duration-300"
                  fill="none"
                />
                
                {/* Inner "S" integrated with scan/check element */}
                <path 
                  d="M12 11C12 11 13 10 16 10C19 10 20 11.5 20 13C20 15 18 15.5 16 16C14 16.5 12 17 12 19C12 20.5 13 22 16 22C19 22 20 21 20 21"
                  stroke="url(#logoGradient)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="group-hover:filter group-hover:[filter:url(#glow)] transition-all duration-300"
                  fill="none"
                />
                
                {/* Small verification dot */}
                <circle 
                  cx="22" 
                  cy="10" 
                  r="2" 
                  fill="url(#logoGradient)"
                  className="group-hover:filter group-hover:[filter:url(#glow)] transition-all duration-300"
                />
              </svg>
              
              {/* Background glow on hover */}
              <div className="absolute inset-0 blur-xl bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
            </div>
            
            <div className="flex items-baseline gap-0.5">
              <span className="text-xl font-bold tracking-tight text-foreground">
                Sec
              </span>
              <span className="text-xl font-bold tracking-tight text-primary">
                Quest
              </span>
            </div>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-semibold px-1.5 py-0">
              AI
            </Badge>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link 
              href="/" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Home
            </Link>
            <Link 
              href="/how-it-works" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              How It Works
            </Link>
            <Link 
              href="/agent" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5" />
              Agent
            </Link>
            <Link 
              href="/knowledge" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              <Database className="w-3.5 h-3.5" />
              Knowledge Base
            </Link>

            {session ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {session.user?.name}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-xs"
                >
                  <LogOut className="w-3.5 h-3.5 mr-1.5" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button asChild size="sm" className="glow-cyan-sm">
                <Link href="/login">
                  Sign In
                </Link>
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border/50 py-4"
          >
            <div className="flex flex-col gap-4">
              <Link 
                href="/" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                href="/how-it-works" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                How It Works
              </Link>
              <Link 
                href="/agent" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Shield className="w-3.5 h-3.5" />
                Agent
              </Link>
              <Link 
                href="/knowledge" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Database className="w-3.5 h-3.5" />
                Knowledge Base
              </Link>

              {session ? (
                <div className="flex flex-col gap-2 pt-2 border-t border-border/30">
                  <span className="text-xs text-muted-foreground">
                    Signed in as {session.user?.name}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-fit text-xs"
                  >
                    <LogOut className="w-3.5 h-3.5 mr-1.5" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Button asChild size="sm" className="w-fit glow-cyan-sm">
                  <Link href="/login">
                    Sign In
                  </Link>
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  )
}
