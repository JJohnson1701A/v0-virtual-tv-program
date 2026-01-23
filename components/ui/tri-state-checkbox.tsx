"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Check, X } from "lucide-react"

export type TriState = "unchecked" | "checked" | "excluded"

interface TriStateCheckboxProps {
  id?: string
  value: TriState
  onValueChange: (value: TriState) => void
  className?: string
  disabled?: boolean
}

export function TriStateCheckbox({ id, value, onValueChange, className, disabled }: TriStateCheckboxProps) {
  const handleClick = () => {
    if (disabled) return
    // Cycle through states: unchecked -> checked -> excluded -> unchecked
    if (value === "unchecked") {
      onValueChange("checked")
    } else if (value === "checked") {
      onValueChange("excluded")
    } else {
      onValueChange("unchecked")
    }
  }

  return (
    <button
      type="button"
      id={id}
      role="checkbox"
      aria-checked={value === "checked" ? true : value === "excluded" ? "mixed" : false}
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        "h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center",
        value === "checked" && "bg-primary text-primary-foreground",
        value === "excluded" && "bg-destructive text-destructive-foreground",
        value === "unchecked" && "bg-background",
        className
      )}
    >
      {value === "checked" && <Check className="h-3 w-3" />}
      {value === "excluded" && <X className="h-3 w-3" />}
    </button>
  )
}
