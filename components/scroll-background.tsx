"use client"

import { useEffect, useRef } from "react"

export function ScrollBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scrollY = useRef(0)
  const animFrame = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener("resize", resize)

    const onScroll = () => {
      scrollY.current = window.scrollY
    }
    window.addEventListener("scroll", onScroll, { passive: true })

    // Orb definitions (relative positions + colors)
    const orbs = [
      { x: 0.15, y: 0.2, r: 350, color: "rgba(0, 212, 255, 0.07)", speedX: 0.00012, speedY: 0.00008 },
      { x: 0.85, y: 0.6, r: 280, color: "rgba(0, 180, 220, 0.05)", speedX: -0.0001, speedY: 0.00006 },
      { x: 0.5,  y: 0.9, r: 400, color: "rgba(0, 140, 200, 0.04)", speedX: 0.00006, speedY: -0.0001 },
    ]

    let time = 0

    const draw = () => {
      const w = canvas.width
      const h = canvas.height
      const scroll = scrollY.current

      ctx.clearRect(0, 0, w, h)

      // Base dark background
      ctx.fillStyle = "hsl(222, 47%, 4%)"
      ctx.fillRect(0, 0, w, h)

      // Subtle grid lines
      ctx.strokeStyle = "rgba(0, 212, 255, 0.03)"
      ctx.lineWidth = 1
      const gridSize = 60
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, h)
        ctx.stroke()
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
        ctx.stroke()
      }

      // Animated gradient orbs
      orbs.forEach((orb) => {
        const cx = (orb.x + Math.sin(time * orb.speedX * 1000) * 0.08) * w
        const cy = (orb.y + Math.cos(time * orb.speedY * 1000) * 0.06) * h - scroll * 0.15

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, orb.r)
        grad.addColorStop(0, orb.color)
        grad.addColorStop(1, "transparent")

        ctx.beginPath()
        ctx.arc(cx, cy, orb.r, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()
      })

      time += 16
      animFrame.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animFrame.current)
      window.removeEventListener("resize", resize)
      window.removeEventListener("scroll", onScroll)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  )
}
