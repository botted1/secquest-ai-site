"use client"

import { useEffect, useRef } from "react"

export function ScrollBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scrollY = useRef(0)
  const animFrame = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d", { alpha: false })
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    // Offscreen canvas holds the static layer (base + grid). We only repaint
    // the cheap, animated orb layer on top of it each frame.
    const staticCanvas = document.createElement("canvas")
    const staticCtx = staticCanvas.getContext("2d", { alpha: false })!

    let cssWidth = 0
    let cssHeight = 0

    const paintStatic = () => {
      const w = cssWidth
      const h = cssHeight

      staticCanvas.width = Math.floor(w * dpr)
      staticCanvas.height = Math.floor(h * dpr)
      staticCanvas.style.width = `${w}px`
      staticCanvas.style.height = `${h}px`
      staticCtx.setTransform(dpr, 0, 0, dpr, 0, 0)

      // Base dark background
      staticCtx.fillStyle = "hsl(222, 47%, 4%)"
      staticCtx.fillRect(0, 0, w, h)

      // Subtle grid lines — drawn once, then cached.
      staticCtx.strokeStyle = "rgba(0, 212, 255, 0.05)"
      staticCtx.lineWidth = 1
      const gridSize = 60

      // Snap to 0.5 px so 1 px lines render crisply (otherwise they shimmer).
      staticCtx.beginPath()
      for (let x = 0.5; x < w; x += gridSize) {
        staticCtx.moveTo(x, 0)
        staticCtx.lineTo(x, h)
      }
      for (let y = 0.5; y < h; y += gridSize) {
        staticCtx.moveTo(0, y)
        staticCtx.lineTo(w, y)
      }
      staticCtx.stroke()
    }

    const resize = () => {
      cssWidth = window.innerWidth
      cssHeight = window.innerHeight
      canvas.width = Math.floor(cssWidth * dpr)
      canvas.height = Math.floor(cssHeight * dpr)
      canvas.style.width = `${cssWidth}px`
      canvas.style.height = `${cssHeight}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      paintStatic()
    }
    resize()
    window.addEventListener("resize", resize)

    const onScroll = () => {
      scrollY.current = window.scrollY
    }
    window.addEventListener("scroll", onScroll, { passive: true })

    const orbs = [
      { x: 0.15, y: 0.2, r: 350, color: "rgba(0, 212, 255, 0.07)", speedX: 0.12, speedY: 0.08 },
      { x: 0.85, y: 0.6, r: 280, color: "rgba(0, 180, 220, 0.05)", speedX: -0.10, speedY: 0.06 },
      { x: 0.5,  y: 0.9, r: 400, color: "rgba(0, 140, 200, 0.04)", speedX: 0.06, speedY: -0.10 },
    ]

    let lastTime = performance.now()
    let elapsed = 0
    // Smoothed scroll value — eases toward the latest scrollY so per-frame
    // deltas are tiny and visually continuous instead of jumping.
    let smoothedScroll = window.scrollY

    const draw = (now: number) => {
      const dt = Math.min(now - lastTime, 50) // clamp tab-switch spikes
      lastTime = now
      elapsed += dt / 1000 // seconds

      smoothedScroll += (scrollY.current - smoothedScroll) * 0.1

      const w = cssWidth
      const h = cssHeight

      // Blit cached static layer (base + grid) — single, cheap drawImage.
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.drawImage(staticCanvas, 0, 0)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      // Animated gradient orbs only.
      for (const orb of orbs) {
        const cx = (orb.x + Math.sin(elapsed * orb.speedX) * 0.08) * w
        const cy = (orb.y + Math.cos(elapsed * orb.speedY) * 0.06) * h - smoothedScroll * 0.15

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, orb.r)
        grad.addColorStop(0, orb.color)
        grad.addColorStop(1, "transparent")

        ctx.fillStyle = grad
        ctx.fillRect(cx - orb.r, cy - orb.r, orb.r * 2, orb.r * 2)
      }

      animFrame.current = requestAnimationFrame(draw)
    }

    animFrame.current = requestAnimationFrame(draw)

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
