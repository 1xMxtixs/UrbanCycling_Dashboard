"use client"

import { Check, ChevronDown } from "lucide-react"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { selectItemClassName, selectTriggerClassName } from "@/components/ui/select"
import { cn } from "@/lib/utils"

export type MultiSelectOption = {
  value: string
  label: string
  disabled?: boolean
}

type MultiSelectProps = {
  options: MultiSelectOption[]
  value: string[]
  onChange: (value: string[]) => void
  emptyLabel: string
  ariaLabel: string
  multipleLabel: string
  disabled?: boolean
}

export function MultiSelect({
  options,
  value,
  onChange,
  emptyLabel,
  ariaLabel,
  multipleLabel,
  disabled = false,
}: MultiSelectProps) {
  const labelsByValue = new Map(options.map((option) => [option.value, option.label]))
  const selectedLabels = value.map((optionValue) => labelsByValue.get(optionValue) ?? optionValue)
  const summary =
    selectedLabels.length === 0
      ? emptyLabel
      : selectedLabels.length === 1
        ? selectedLabels[0]
        : `${selectedLabels.length} ${multipleLabel}`

  const toggleValue = (optionValue: string) => {
    onChange(
      value.includes(optionValue)
        ? value.filter((selectedValue) => selectedValue !== optionValue)
        : [...value, optionValue]
    )
  }

  return (
    <Popover modal>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-size="default"
          aria-label={`${ariaLabel}: ${summary}`}
          aria-haspopup="listbox"
          className={cn(
            selectTriggerClassName,
            "h-10 w-full bg-background text-left",
            disabled && "pointer-events-none opacity-50"
          )}
          disabled={disabled}
        >
          <span className="min-w-0 flex-1 truncate" title={summary}>{summary}</span>
          <ChevronDown className="pointer-events-none size-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={4}
        collisionPadding={8}
        className="scrollbar-hidden max-h-[min(20rem,var(--radix-popper-available-height))] w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-2rem)] min-w-36 gap-0 overflow-x-hidden overflow-y-auto rounded-lg border-0 bg-popover p-1 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10"
      >
        <div role="listbox" aria-label={ariaLabel} aria-multiselectable="true">
          <button
            type="button"
            role="option"
            aria-selected={value.length === 0}
            className={cn(
              selectItemClassName,
              "justify-between hover:bg-accent hover:text-accent-foreground",
              value.length === 0 && "bg-accent/60 text-accent-foreground"
            )}
            disabled={disabled}
            onClick={() => onChange([])}
          >
            {emptyLabel}
            {value.length === 0 && <Check className="absolute right-2 size-4" />}
          </button>
          {options.map((option) => {
            const isSelected = value.includes(option.value)

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={cn(
                  selectItemClassName,
                  "justify-between hover:bg-accent hover:text-accent-foreground",
                  isSelected && "bg-accent/60 text-accent-foreground"
                )}
                disabled={disabled || option.disabled}
                onClick={() => toggleValue(option.value)}
              >
                <span className="min-w-0 truncate">{option.label}</span>
                {isSelected && <Check className="absolute right-2 size-4" />}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
