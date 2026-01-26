"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { Label } from "@/components/ui/label"
import { TriStateCheckbox, type TriState } from "@/components/ui/tri-state-checkbox"
import { contentWarningCategories, type ContentWarningFilter } from "@/lib/content-warnings"

interface ContentWarningFilterProps {
  value: ContentWarningFilter
  onChange: (value: ContentWarningFilter) => void
}

export function ContentWarningFilterSelector({ value, onChange }: ContentWarningFilterProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  const toggleCategory = (categoryId: string) => {
    const newCategories = new Set(expandedCategories)
    if (newCategories.has(categoryId)) {
      newCategories.delete(categoryId)
    } else {
      newCategories.add(categoryId)
    }
    setExpandedCategories(newCategories)
  }

  const getTriState = (itemValue: string): TriState => {
    if (value.include.includes(itemValue)) return "checked"
    if (value.exclude.includes(itemValue)) return "excluded"
    return "unchecked"
  }

  const handleTriStateChange = (itemValue: string, newState: TriState) => {
    // Remove from both arrays first
    const newInclude = value.include.filter((v) => v !== itemValue)
    const newExclude = value.exclude.filter((v) => v !== itemValue)

    if (newState === "checked") {
      newInclude.push(itemValue)
    } else if (newState === "excluded") {
      newExclude.push(itemValue)
    }

    onChange({ include: newInclude, exclude: newExclude })
  }

  const isCategoryActive = (categoryId: string) => {
    return value.include.includes(categoryId) || value.exclude.includes(categoryId)
  }

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-sm font-medium">Content Warning Filter</Label>
        <p className="text-xs text-muted-foreground">
          Click to cycle: blank (neutral) - check (require) - X (exclude)
        </p>
      </div>

      <div className="border rounded-md p-3 max-h-80 overflow-y-auto space-y-2">
        {contentWarningCategories.map((category) => {
          const isActive = isCategoryActive(category.id)
          const isExpanded = expandedCategories.has(category.id)

          return (
            <div key={category.id} className="space-y-1">
              <div className="flex items-center gap-2">
                <TriStateCheckbox
                  id={`cwf-${category.id}`}
                  value={getTriState(category.id)}
                  onValueChange={(newState) => handleTriStateChange(category.id, newState)}
                />
                <label
                  htmlFor={`cwf-${category.id}`}
                  className="text-sm font-medium cursor-pointer flex-1"
                >
                  {category.label}
                </label>
                <button
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground italic ml-6">{category.description}</p>

              {/* Subcategories - show if expanded */}
              {isExpanded && (
                <div className="ml-6 mt-2 space-y-1 border-l-2 border-gray-200 pl-3">
                  {category.subcategories.map((sub) => (
                    <div key={sub.value} className="flex items-center gap-2">
                      <TriStateCheckbox
                        id={`cwf-sub-${sub.value}`}
                        value={getTriState(sub.value)}
                        onValueChange={(newState) => handleTriStateChange(sub.value, newState)}
                      />
                      <label
                        htmlFor={`cwf-sub-${sub.value}`}
                        className="text-xs cursor-pointer"
                      >
                        {sub.label}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
