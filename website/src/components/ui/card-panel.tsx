'use client'

import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Maximize2, Minimize2 } from "lucide-react"
import { Button } from "./button"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"
import React, { useState, useEffect } from "react"

interface TabItem {
  value: string
  label: string | null
  content?: React.ReactNode
  footer?: React.ReactNode
}

interface CardPanelProps {
  className?: string
  header?: {
    tabs?: TabItem[]
    defaultValue?: string
    value?: string
    onValueChange?: (value: string) => void
    extra?: React.ReactNode
  }
  footer?: React.ReactNode
  children?: React.ReactNode
  onToggleSize?: () => void
  isExpanded?: boolean
}

function ResizeHandle() {
  return (
    <PanelResizeHandle className="w-2 relative group">
      <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1
                      group-hover:bg-border group-data-[resize-handle-active]:bg-primary
                      rounded transition-colors cursor-col-resize" />
    </PanelResizeHandle>
  )
}

interface CardPanelGroupProps {
  className?: string
  children: React.ReactNode
  defaultLayout?: number[]
  onLayout?: (sizes: number[]) => void
}

export function CardPanelGroup({
  className,
  children,
  defaultLayout = [33.33, 66.67],
  onLayout,
}: CardPanelGroupProps) {
  return (
    <PanelGroup
      direction="horizontal"
      className={className}
      onLayout={onLayout}
    >
      {React.Children.map(children, (child, index) => (
        <>
          <Panel
            defaultSize={defaultLayout[index]}
            minSize={20}
          >
            {child}
          </Panel>
          {index < React.Children.count(children) - 1 && <ResizeHandle />}
        </>
      ))}
    </PanelGroup>
  )
}

export function CardPanel({
  className,
  header,
  footer,
  children,
  onToggleSize,
  isExpanded
}: CardPanelProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className={cn(
      "flex flex-col rounded-lg border bg-card shadow-sm",
      className
    )}>
      {header?.tabs && mounted ? (
        <Tabs
          value={header.value}
          defaultValue={header.defaultValue || header.tabs[0].value}
          onValueChange={header.onValueChange}
          className="flex flex-col h-full"
        >
          <div className="flex-none flex items-center px-4 h-12 border-b">
            <TabsList className="h-8">
              {header.tabs.map(tab => tab.label && (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <span className="ml-auto">
              {header.extra}
            </span>
            {onToggleSize && (
              <Button variant="ghost" size="icon" className="ml-2" onClick={onToggleSize}>
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            )}
          </div>
          <div className="flex-1 min-h-0 relative">
            {header.tabs.map(tab => (
              <TabsContent
                key={tab.value}
                value={tab.value}
                className="absolute inset-0 flex flex-col data-[state=inactive]:pointer-events-none data-[state=inactive]:hidden"
              >
                <div className="flex-1 overflow-auto">
                  {tab.content}
                </div>
                {tab.footer && (
                  <div className="flex-none border-t p-1 px-3">
                    {tab.footer}
                  </div>
                )}
              </TabsContent>
            ))}
          </div>
          {footer && (
            <div className="flex-none border-t p-1 px-3">
              {footer}
            </div>
          )}
        </Tabs>
      ) : (
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      )}
    </div>
  )
}