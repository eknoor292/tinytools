"use client"

import { forwardRef, useEffect, useRef, useState } from "react"

interface EditorCanvasProps {
  tool: string
  zoom: number
}

export const EditorCanvas = forwardRef<HTMLCanvasElement, EditorCanvasProps>(({ tool, zoom }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!ref || typeof ref === "function") return

    const canvas = ref.current
    if (!canvas) return

    const handleMouseDown = (e: MouseEvent) => {
      if (tool !== "brush" && tool !== "eraser") return

      setIsDrawing(true)
      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      const x = (e.clientX - rect.left) * scaleX
      const y = (e.clientY - rect.top) * scaleY
      setLastPos({ x, y })
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDrawing || (tool !== "brush" && tool !== "eraser")) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      const x = (e.clientX - rect.left) * scaleX
      const y = (e.clientY - rect.top) * scaleY

      ctx.beginPath()
      ctx.moveTo(lastPos.x, lastPos.y)
      ctx.lineTo(x, y)
      ctx.strokeStyle = tool === "brush" ? "#000000" : "#ffffff"
      ctx.lineWidth = 5
      ctx.lineCap = "round"
      ctx.stroke()

      setLastPos({ x, y })
    }

    const handleMouseUp = () => {
      setIsDrawing(false)
    }

    canvas.addEventListener("mousedown", handleMouseDown)
    canvas.addEventListener("mousemove", handleMouseMove)
    canvas.addEventListener("mouseup", handleMouseUp)
    canvas.addEventListener("mouseleave", handleMouseUp)

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown)
      canvas.removeEventListener("mousemove", handleMouseMove)
      canvas.removeEventListener("mouseup", handleMouseUp)
      canvas.removeEventListener("mouseleave", handleMouseUp)
    }
  }, [ref, tool, isDrawing, lastPos])

  return (
    <div
      ref={containerRef}
      className="relative overflow-auto max-w-full max-h-full"
      style={{
        width: "100%",
        height: "100%",
      }}
    >
      <div className="min-w-fit min-h-fit inline-block">
        <canvas
          ref={ref}
          className="border border-border shadow-sm bg-white"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: "center",
            cursor: tool === "brush" || tool === "eraser" ? "crosshair" : "default",
          }}
        />
      </div>
    </div>
  )
})

EditorCanvas.displayName = "EditorCanvas"

