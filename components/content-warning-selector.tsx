"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { contentWarningCategories, type ContentWarningData } from "@/lib/content-warnings"

interface ContentWarningSelectorProps {
  value: ContentWarningData
  onChange: (value: ContentWarningData) => void
}

export function ContentWarningSelector({ value, onChange }: ContentWarningSelectorProps) {
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

  const handleEnableToggle = (enabled: boolean) => {
    onChange({ ...value, enabled })
  }

  const handleCategoryToggle = (categoryId: string, checked: boolean) => {
    const newCategories = checked
      ? [...value.categories, categoryId]
      : value.categories.filter((c) => c !== categoryId)
    
    // If unchecking category, also remove its subcategories
    let newSubcategories = value.subcategories
    if (!checked) {
      const category = contentWarningCategories.find((c) => c.id === categoryId)
      if (category) {
        const subcategoryValues = category.subcategories.map((s) => s.value)
        newSubcategories = value.subcategories.filter((s) => !subcategoryValues.includes(s))
      }
    }
    
    onChange({ ...value, categories: newCategories, subcategories: newSubcategories })
  }

  const handleSubcategoryToggle = (subcategoryValue: string, checked: boolean) => {
    const newSubcategories = checked
      ? [...value.subcategories, subcategoryValue]
      : value.subcategories.filter((s) => s !== subcategoryValue)
    onChange({ ...value, subcategories: newSubcategories })
  }

  const isCategoryChecked = (categoryId: string) => value.categories.includes(categoryId)
  const isSubcategoryChecked = (subcategoryValue: string) => value.subcategories.includes(subcategoryValue)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Content Warning</Label>
        <Switch checked={value.enabled} onCheckedChange={handleEnableToggle} />
      </div>

      {value.enabled && (
        <div className="border rounded-md p-3 max-h-80 overflow-y-auto space-y-2">
          {contentWarningCategories.map((category) => {
            const isChecked = isCategoryChecked(category.id)
            const isExpanded = expandedCategories.has(category.id)

            return (
              <div key={category.id} className="space-y-1">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`cw-${category.id}`}
                    checked={isChecked}
                    onCheckedChange={(checked) => handleCategoryToggle(category.id, checked as boolean)}
                  />
                  <label
                    htmlFor={`cw-${category.id}`}
                    className="text-sm font-medium cursor-pointer flex-1"
                  >
                    {category.label}
                  </label>
                  {isChecked && (
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
                  )}
                </div>
                <p className="text-xs text-muted-foreground italic ml-6">{category.description}</p>

                {/* Subcategories - only show if category is checked and expanded */}
                {isChecked && isExpanded && (
                  <div className="ml-6 mt-2 space-y-1 border-l-2 border-gray-200 pl-3">
                    {category.subcategories.map((sub) => (
                      <div key={sub.value} className="flex items-center gap-2">
                        <Checkbox
                          id={`cw-sub-${sub.value}`}
                          checked={isSubcategoryChecked(sub.value)}
                          onCheckedChange={(checked) =>
                            handleSubcategoryToggle(sub.value, checked as boolean)
                          }
                        />
                        <label
                          htmlFor={`cw-sub-${sub.value}`}
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
      )}
    </div>
  )
}
