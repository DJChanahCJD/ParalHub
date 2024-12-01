import * as React from "react"
import { Check } from "lucide-react"
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface Option {
  _id: string
  name: string
}

interface CommandSelectProps {
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  emptyText?: string
  className?: string
}

export function CommandSelect({
  options = [],
  value,
  onChange,
  placeholder = "选择选项...",
  emptyText = "没有找到选项",
  className,
}: CommandSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")

  const safeOptions = React.useMemo(() =>
    Array.isArray(options) ? options : []
  , [options])

  const selectedOption = React.useMemo(() =>
    safeOptions.find(option => option._id === value)
  , [safeOptions, value])

  const filteredOptions = React.useMemo(() =>
    safeOptions.filter((option) =>
      option.name.toLowerCase().includes(inputValue.toLowerCase())
    )
  , [safeOptions, inputValue])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {selectedOption?.name || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={`搜索${placeholder}`}
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            {filteredOptions.map((option) => (
              <CommandItem
                key={option._id}
                value={option.name}
                onSelect={() => {
                  onChange(option._id)
                  setOpen(false)
                  setInputValue("")
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === option._id ? "opacity-100" : "opacity-0"
                  )}
                />
                {option.name}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}