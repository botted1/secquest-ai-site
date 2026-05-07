"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Shield, Loader2, AlertCircle, Lock, User, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid credentials. Please try again.")
      } else {
        router.push("/agent")
        router.refresh()
      }
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleGuestLogin = async () => {
    setError("")
    setLoading(true)
    try {
      const result = await signIn("credentials", {
        username: "guest",
        password: "guest",
        redirect: false,
      })
      if (result?.error) {
        setError("Guest login failed. Please try again.")
      } else {
        router.push("/agent")
        router.refresh()
      }
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center bg-background overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid opacity-10" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Animated particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full"
            initial={{
              x: `${20 + i * 15}%`,
              y: "110%",
              opacity: 0,
            }}
            animate={{
              y: "-10%",
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              delay: i * 1.5,
              ease: "linear",
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md px-4"
      >
        <Card className="bg-card/60 border-border/50 backdrop-blur-xl shadow-2xl shadow-primary/5">
          <CardHeader className="text-center pb-2 pt-8">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto mb-4"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <div className="absolute -inset-2 bg-primary/10 rounded-3xl blur-xl -z-10" />
              </div>
            </motion.div>

            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-2xl font-bold tracking-tight text-foreground">
                Sec
              </span>
              <span className="text-2xl font-bold tracking-tight text-primary">
                Quest
              </span>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-semibold px-1.5 py-0">
                AI
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Sign in to access the Security Questionnaire Agent
            </p>
          </CardHeader>

          <CardContent className="pt-6 pb-8 px-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg"
                >
                  <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                  <p className="text-sm text-destructive">{error}</p>
                </motion.div>
              )}

              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-foreground">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="pl-10 bg-background/50 border-border/70 focus:border-primary/50 h-11"
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="pl-10 bg-background/50 border-border/70 focus:border-primary/50 h-11"
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 glow-cyan text-base font-medium"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Sign In
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/30" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-card/60 text-xs text-muted-foreground/60 uppercase tracking-wider">
                  or
                </span>
              </div>
            </div>

            {/* Guest login */}
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={handleGuestLogin}
              className="w-full h-11 border-border/50 bg-background/30 hover:bg-primary/5 hover:border-primary/30 text-muted-foreground hover:text-foreground transition-all text-sm font-medium"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 mr-2 text-amber-400" />
              )}
              Continue as Guest
            </Button>

            {/* Security notice */}
            <div className="mt-6 pt-5 border-t border-border/30">
              <p className="text-[11px] text-muted-foreground/60 text-center leading-relaxed">
                Protected by enterprise-grade security.
                <br />
                All sessions are encrypted and expire after 24 hours.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Bottom accent */}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-primary/5 blur-2xl rounded-full" />
      </motion.div>
    </main>
  )
}
