"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TimeSelectProps {
  value: string
  onChange: (value: string) => void
}

export function TimeSelect({ value, onChange }: TimeSelectProps) {
  const timeOptions = []

  // Generate time options in 30-minute intervals
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time24 = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
      const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
      const ampm = hour < 12 ? "AM" : "PM"
      const time12 = `${hour12}:${minute.toString().padStart(2, "0")} ${ampm}`

      timeOptions.push({
        value: time12,
        label: time12,
      })
    }
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-60">
        {timeOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
