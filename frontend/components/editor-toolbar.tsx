"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Crop,
  Type,
  Paintbrush,
  Eraser,
  MousePointer,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface EditorToolbarProps {
  tool: string
  setTool: (tool: string) => void
  onRotateCw: () => void
  onRotateCcw: () => void
  onFlipHorizontal: () => void
  onFlipVertical: () => void
  disabled: boolean
}

export function EditorToolbar({
  tool,
  setTool,
  onRotateCw,
  onRotateCcw,
  onFlipHorizontal,
  onFlipVertical,
  disabled,
}: EditorToolbarProps) {
  const tools = [
    { id: "select", icon: MousePointer, label: "Select" },
    { id: "crop", icon: Crop, label: "Crop" },
    { id: "text", icon: Type, label: "Text" },
    { id: "brush", icon: Paintbrush, label: "Brush" },
    { id: "eraser", icon: Eraser, label: "Eraser" },
  ]

  return (
    <div className="w-16 border-r flex flex-col items-center py-4 bg-background">
      <TooltipProvider>
        {tools.map((item) => (
          <Tooltip key={item.id} delayDuration={300}>
            <TooltipTrigger asChild>
              <Button
                variant={tool === item.id ? "secondary" : "ghost"}
                size="icon"
                className="mb-2"
                onClick={() => setTool(item.id)}
                disabled={disabled}
              >
                <item.icon className="h-5 w-5" />
                <span className="sr-only">{item.label}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{item.label}</p>
            </TooltipContent>
          </Tooltip>
        ))}

        <Separator className="my-2 w-8" />

        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="mb-2" onClick={onRotateCcw} disabled={disabled}>
              <RotateCcw className="h-5 w-5" />
              <span className="sr-only">Rotate Left</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Rotate Left</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="mb-2" onClick={onRotateCw} disabled={disabled}>
              <RotateCw className="h-5 w-5" />
              <span className="sr-only">Rotate Right</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Rotate Right</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="mb-2" onClick={onFlipHorizontal} disabled={disabled}>
              <FlipHorizontal className="h-5 w-5" />
              <span className="sr-only">Flip Horizontal</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Flip Horizontal</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="mb-2" onClick={onFlipVertical} disabled={disabled}>
              <FlipVertical className="h-5 w-5" />
              <span className="sr-only">Flip Vertical</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Flip Vertical</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

