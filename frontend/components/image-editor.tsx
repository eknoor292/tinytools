"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/theme-toggle"
import { EditorCanvas } from "@/components/editor-canvas"
import { EditorToolbar } from "@/components/editor-toolbar"
import { EditorSidebar } from "@/components/editor-sidebar"
import { Download, Upload, Undo, Redo, ZoomIn, ZoomOut, ImageIcon } from "lucide-react"

// Define a type for our edit operations
type EditOperation = {
  type: "adjustment" | "transform"
  adjustments?: {
    brightness: number
    contrast: number
    saturation: number
  }
  transform?: {
    type: "rotate" | "flip"
    params: any
  }
}

export function ImageEditor() {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [tool, setTool] = useState<string>("select")
  const [zoom, setZoom] = useState<number>(100)
  const [originalImageData, setOriginalImageData] = useState<ImageData | null>(null)
  const [history, setHistory] = useState<EditOperation[]>([])
  const [historyIndex, setHistoryIndex] = useState<number>(-1)
  const [adjustments, setAdjustments] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
  })
  const [isAdjusting, setIsAdjusting] = useState(false)
  const [rotationAngle, setRotationAngle] = useState(0)
  const [flipState, setFlipState] = useState({ horizontal: false, vertical: false })

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Add an operation to history
  const addToHistory = (operation: EditOperation) => {
    // If we're not at the end of history, truncate it
    const newHistory = history.slice(0, historyIndex + 1)
    setHistory([...newHistory, operation])
    setHistoryIndex(newHistory.length)
  }

  // Apply all operations to the canvas
  const applyAllOperations = () => {
    if (!canvasRef.current || !originalImageData || !image) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Reset canvas dimensions to match the original image
    canvas.width = originalImageData.width
    canvas.height = originalImageData.height

    // Start with the original image
    ctx.putImageData(originalImageData, 0, 0)

    // Apply all operations up to the current history index
    const operations = history.slice(0, historyIndex + 1)

    // First apply all transforms
    let currentRotation = 0
    const currentFlip = { horizontal: false, vertical: false }

    operations.forEach((op) => {
      if (op.type === "transform" && op.transform) {
        if (op.transform.type === "rotate") {
          currentRotation = (currentRotation + op.transform.params.angle) % 360
        } else if (op.transform.type === "flip") {
          if (op.transform.params.direction === "horizontal") {
            currentFlip.horizontal = !currentFlip.horizontal
          } else {
            currentFlip.vertical = !currentFlip.vertical
          }
        }
      }
    })

    // Apply the current rotation and flip state
    if (currentRotation !== 0 || currentFlip.horizontal || currentFlip.vertical) {
      // Create a temporary canvas for transformations
      const tempCanvas = document.createElement("canvas")
      tempCanvas.width = canvas.width
      tempCanvas.height = canvas.height
      const tempCtx = tempCanvas.getContext("2d", { willReadFrequently: true })

      if (tempCtx) {
        // Copy the current canvas to the temp canvas
        tempCtx.drawImage(canvas, 0, 0)

        // Clear the original canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Handle rotation
        if (currentRotation !== 0) {
          // Determine if we need to swap width and height
          if (currentRotation === 90 || currentRotation === 270) {
            canvas.width = originalImageData.height
            canvas.height = originalImageData.width
          }

          ctx.save()
          ctx.translate(canvas.width / 2, canvas.height / 2)
          ctx.rotate((currentRotation * Math.PI) / 180)
          ctx.drawImage(tempCanvas, -tempCanvas.width / 2, -tempCanvas.height / 2, tempCanvas.width, tempCanvas.height)
          ctx.restore()
        } else {
          ctx.drawImage(tempCanvas, 0, 0)
        }

        // Handle flips
        if (currentFlip.horizontal || currentFlip.vertical) {
          // Create another temp canvas for flipping
          const flipCanvas = document.createElement("canvas")
          flipCanvas.width = canvas.width
          flipCanvas.height = canvas.height
          const flipCtx = flipCanvas.getContext("2d", { willReadFrequently: true })

          if (flipCtx) {
            // Copy the current canvas to the flip canvas
            flipCtx.drawImage(canvas, 0, 0)

            // Clear the original canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            // Apply flips
            ctx.save()
            ctx.translate(currentFlip.horizontal ? canvas.width : 0, currentFlip.vertical ? canvas.height : 0)
            ctx.scale(currentFlip.horizontal ? -1 : 1, currentFlip.vertical ? -1 : 1)
            ctx.drawImage(flipCanvas, 0, 0, flipCanvas.width, flipCanvas.height)
            ctx.restore()
          }
        }
      }
    }

    // Now apply the current adjustment
    const currentAdjustment = operations
      .filter((op) => op.type === "adjustment" && op.adjustments)
      .map((op) => op.adjustments)
      .pop() || { brightness: 100, contrast: 100, saturation: 100 }

    applyAdjustments(currentAdjustment)

    // Update state to match the current operations
    setRotationAngle(currentRotation)
    setFlipState(currentFlip)
    setAdjustments(currentAdjustment)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.onload = () => {
          setImage(img)
          if (canvasRef.current) {
            const ctx = canvasRef.current.getContext("2d", { willReadFrequently: true })
            if (ctx) {
              canvasRef.current.width = img.width
              canvasRef.current.height = img.height
              ctx.drawImage(img, 0, 0)

              // Save the original image data
              const imageData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)
              setOriginalImageData(imageData)

              // Reset history with initial state
              const initialOperation: EditOperation = {
                type: "adjustment",
                adjustments: {
                  brightness: 100,
                  contrast: 100,
                  saturation: 100,
                },
              }
              setHistory([initialOperation])
              setHistoryIndex(0)

              // Reset adjustments and transforms
              setAdjustments({
                brightness: 100,
                contrast: 100,
                saturation: 100,
              })
              setRotationAngle(0)
              setFlipState({ horizontal: false, vertical: false })
            }
          }
        }
        img.src = event.target?.result as string
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
    }
  }

  const handleRotate = (direction: "cw" | "ccw") => {
    if (!image) return

    const angle = direction === "cw" ? 90 : -90

    // Add the rotation operation to history
    const operation: EditOperation = {
      type: "transform",
      transform: {
        type: "rotate",
        params: { angle },
      },
    }

    addToHistory(operation)
  }

  const handleFlip = (direction: "horizontal" | "vertical") => {
    if (!image) return

    // Add the flip operation to history
    const operation: EditOperation = {
      type: "transform",
      transform: {
        type: "flip",
        params: { direction },
      },
    }

    addToHistory(operation)
  }

  const handleDownload = () => {
    if (canvasRef.current) {
      const link = document.createElement("a")
      link.download = "edited-image.png"
      link.href = canvasRef.current.toDataURL("image/png")
      link.click()
    }
  }

  const applyAdjustments = (adjustmentValues: { brightness: number; contrast: number; saturation: number }) => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return

    // Get the current image data
    const currentImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = currentImageData.data

    // Apply adjustments
    for (let i = 0; i < data.length; i += 4) {
      // Brightness
      const brightnessValue = (adjustmentValues.brightness - 100) * 2.55
      data[i] = Math.min(255, Math.max(0, data[i] + brightnessValue))
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + brightnessValue))
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + brightnessValue))

      // Contrast
      const factor = (259 * (adjustmentValues.contrast + 255)) / (255 * (259 - adjustmentValues.contrast))
      data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128))
      data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128))
      data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128))

      // Saturation
      const satFactor = adjustmentValues.saturation / 100
      const gray = 0.2989 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
      data[i] = Math.min(255, Math.max(0, gray + satFactor * (data[i] - gray)))
      data[i + 1] = Math.min(255, Math.max(0, gray + satFactor * (data[i + 1] - gray)))
      data[i + 2] = Math.min(255, Math.max(0, gray + satFactor * (data[i + 2] - gray)))
    }

    ctx.putImageData(currentImageData, 0, 0)
  }

  // Save adjustments to history
  const saveAdjustments = () => {
    const operation: EditOperation = {
      type: "adjustment",
      adjustments: { ...adjustments },
    }
    addToHistory(operation)
  }

  // Apply all operations whenever history changes
  useEffect(() => {
    if (historyIndex >= 0 && history.length > 0) {
      applyAllOperations()
    }
  }, [historyIndex, history])

  // Handle adjustment changes with debounce
  useEffect(() => {
    if (image && originalImageData) {
      // Set a flag to indicate we're adjusting
      setIsAdjusting(true)

      // Debounce saving to history
      const timer = setTimeout(() => {
        if (isAdjusting) {
          saveAdjustments()
          setIsAdjusting(false)
        }
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [adjustments])

  return (
    <div className="flex flex-col h-screen">
      <header className="border-b p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-6 w-6" />
          <h1 className="text-xl font-bold">Image Editor</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4" />
            <span className="sr-only">Upload</span>
          </Button>
          <Input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          <Button variant="outline" size="icon" onClick={handleDownload} disabled={!image}>
            <Download className="h-4 w-4" />
            <span className="sr-only">Download</span>
          </Button>
          <Button variant="outline" size="icon" onClick={handleUndo} disabled={historyIndex <= 0}>
            <Undo className="h-4 w-4" />
            <span className="sr-only">Undo</span>
          </Button>
          <Button variant="outline" size="icon" onClick={handleRedo} disabled={historyIndex >= history.length - 1}>
            <Redo className="h-4 w-4" />
            <span className="sr-only">Redo</span>
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <EditorToolbar
          tool={tool}
          setTool={setTool}
          onRotateCw={() => handleRotate("cw")}
          onRotateCcw={() => handleRotate("ccw")}
          onFlipHorizontal={() => handleFlip("horizontal")}
          onFlipVertical={() => handleFlip("vertical")}
          disabled={!image}
        />

        <div className="flex-1 overflow-auto flex items-center justify-center bg-muted/40 p-4">
          <div className="overflow-auto max-w-full max-h-full">
            <EditorCanvas ref={canvasRef} tool={tool} zoom={zoom} />
          </div>
        </div>

        <EditorSidebar>
          <Tabs defaultValue="adjust">
            <TabsList className="w-full">
              <TabsTrigger value="adjust" className="flex-1">
                Adjust
              </TabsTrigger>
              <TabsTrigger value="filters" className="flex-1">
                Filters
              </TabsTrigger>
            </TabsList>
            <TabsContent value="adjust" className="space-y-4 pt-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="brightness">Brightness</Label>
                  <span>{adjustments.brightness}%</span>
                </div>
                <Slider
                  id="brightness"
                  min={0}
                  max={200}
                  step={1}
                  value={[adjustments.brightness]}
                  onValueChange={(value) => setAdjustments({ ...adjustments, brightness: value[0] })}
                  disabled={!image}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="contrast">Contrast</Label>
                  <span>{adjustments.contrast}%</span>
                </div>
                <Slider
                  id="contrast"
                  min={0}
                  max={200}
                  step={1}
                  value={[adjustments.contrast]}
                  onValueChange={(value) => setAdjustments({ ...adjustments, contrast: value[0] })}
                  disabled={!image}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="saturation">Saturation</Label>
                  <span>{adjustments.saturation}%</span>
                </div>
                <Slider
                  id="saturation"
                  min={0}
                  max={200}
                  step={1}
                  value={[adjustments.saturation]}
                  onValueChange={(value) => setAdjustments({ ...adjustments, saturation: value[0] })}
                  disabled={!image}
                />
              </div>
            </TabsContent>
            <TabsContent value="filters" className="pt-4">
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="h-20" disabled={!image}>
                  Grayscale
                </Button>
                <Button variant="outline" className="h-20" disabled={!image}>
                  Sepia
                </Button>
                <Button variant="outline" className="h-20" disabled={!image}>
                  Invert
                </Button>
                <Button variant="outline" className="h-20" disabled={!image}>
                  Blur
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-auto pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ZoomOut className="h-4 w-4" />
                <Slider
                  id="zoom"
                  min={10}
                  max={200}
                  step={10}
                  value={[zoom]}
                  onValueChange={(value) => setZoom(value[0])}
                  disabled={!image}
                  className="w-24"
                />
                <ZoomIn className="h-4 w-4" />
              </div>
              <div>{zoom}%</div>
            </div>
          </div>
        </EditorSidebar>
      </div>
    </div>
  )
}

