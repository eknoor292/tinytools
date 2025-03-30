import type { ReactNode } from "react"

interface EditorSidebarProps {
  children: ReactNode
}

export function EditorSidebar({ children }: EditorSidebarProps) {
  return <div className="w-64 border-l p-4 bg-background overflow-y-auto">{children}</div>
}

