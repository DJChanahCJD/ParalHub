import * as React from "react"
import { X, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Command,
  CommandEmpty,
  CommandList,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface Option {
  _id: string
  name: string
}

interface MultiSelectProps {
  options: Option[]
  selected: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  emptyText?: string
  className?: string
  optionClassName?: string
  selectedClassName?: string
}

export function MultiSelect({
  options = [],
  selected = [],
  onChange,
  placeholder = '选择选项...',
  emptyText = '没有找到选项',
  className,
  optionClassName,
  selectedClassName,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  const safeOptions = React.useMemo(() =>
    Array.isArray(options) ? options : []
  , [options])

  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return safeOptions

    return safeOptions.filter(option =>
      option.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [safeOptions, searchQuery])

  const handleUnselect = React.useCallback((itemId: string) => {
    onChange(selected.filter((id) => id !== itemId))
  }, [onChange, selected])

  const selectedItemsMap = React.useMemo(() =>
    selected.reduce<Record<string, string>>((acc, id) => {
      const option = safeOptions.find(opt => opt._id === id)
      if (option) {
        acc[id] = option.name
      }
      return acc
    }, {})
  , [selected, safeOptions])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between hover:border-[hsl(var(--primary))] focus:border-[hsl(var(--primary))]",
            selected.length > 0 ? "min-h-[2.5rem] h-auto py-1" : "h-10",
            className
          )}
        >
          <div className="flex flex-wrap gap-1">
            {selected.length > 0 ? (
              selected.map((id) => (
                <Badge
                  key={id}
                  className={cn(
                    "flex items-center gap-1 text-xs py-0.5 px-2",
                    "bg-[hsl(var(--primary))] text-primary-foreground",
                    selectedClassName
                  )}
                >
                  {selectedItemsMap[id] || id}
                  <span
                    title="取消选择"
                    role="button"
                    className="cursor-pointer rounded-full hover:bg-primary-foreground/20"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleUnselect(id)
                    }}
                  >
                    <X className="h-3 w-3 text-primary-foreground" />
                  </span>
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="搜索..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            autoFocus
            className="border-none focus:ring-0 focus:ring-offset-0"
          />
          <CommandList>
            {filteredOptions.length === 0 ? (
              <CommandEmpty className="text-muted-foreground p-2">
                {searchQuery.trim() ? `没有找到"${searchQuery}"相关的选项` : emptyText}
              </CommandEmpty>
            ) : (
              filteredOptions.map((option) => (
                <CommandItem
                  key={option._id}
                  value={option.name}
                  onSelect={() => {
                    onChange(
                      selected.includes(option._id)
                        ? selected.filter((id) => id !== option._id)
                        : [...selected, option._id]
                    )
                  }}
                  className={cn(
                    "hover:bg-[hsl(var(--primary))] hover:text-primary-foreground",
                    "focus:bg-[hsl(var(--primary))] focus:text-primary-foreground",
                    "transition-colors duration-200",
                    optionClassName
                  )}
                >
                  <div
                    className={cn(
                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border transition-colors duration-200",
                      selected.includes(option._id)
                        ? "border-primary-foreground bg-primary-foreground text-[hsl(var(--primary))]"
                        : "border-[hsl(var(--primary))] opacity-50 [&_svg]:invisible",
                      "group-hover:border-primary-foreground group-hover:opacity-100",
                      "group-focus:border-primary-foreground group-focus:opacity-100"
                    )}
                  >
                    <Check className={cn(
                      "h-3 w-3 transition-opacity duration-200",
                      selected.includes(option._id) ? "opacity-100" : "opacity-0"
                    )} />
                  </div>
                  <span>{option.name}</span>
                </CommandItem>
              ))
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
