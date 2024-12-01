import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ReactNode } from "react"

interface TooltipItemProps {
  children: ReactNode
  tooltip: string
  className?: string
  side?: "top" | "right" | "bottom" | "left"
  delayDuration?: number
}

export function TooltipItem({
  children,
  tooltip,
  className,
  side = "bottom",
  delayDuration = 200,
}: TooltipItemProps) {
  return (
    <Tooltip delayDuration={delayDuration}>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent className={className} side={side}>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  )
}