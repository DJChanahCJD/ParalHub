import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "md:text-sm",
          "[&::-webkit-search-cancel-button]:appearance-none",
          "[&::-webkit-search-cancel-button]:h-4",
          "[&::-webkit-search-cancel-button]:w-4",
          "[&::-webkit-search-cancel-button]:bg-muted-foreground/40",
          "[&::-webkit-search-cancel-button]:hover:bg-muted-foreground/60",
          "[&::-webkit-search-cancel-button]:cursor-pointer",
          "[&::-webkit-search-cancel-button]:rounded-full",
          "[&::-webkit-search-cancel-button]:transition-colors",
          "[&::-webkit-search-cancel-button]:bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22white%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cline%20x1%3D%2218%22%20y1%3D%226%22%20x2%3D%226%22%20y2%3D%2218%22%3E%3C%2Fline%3E%3Cline%20x1%3D%226%22%20y1%3D%226%22%20x2%3D%2218%22%20y2%3D%2218%22%3E%3C%2Fline%3E%3C%2Fsvg%3E')]",
          "[&::-webkit-search-cancel-button]:bg-center",
          "[&::-webkit-search-cancel-button]:bg-no-repeat",
          "[&::-webkit-search-cancel-button]:bg-contain",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
