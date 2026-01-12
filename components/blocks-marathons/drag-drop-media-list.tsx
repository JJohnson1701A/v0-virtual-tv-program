"use client"

import type React from "react"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GripVerticalIcon } from "lucide-react"
import type { BlockMediaItem } from "@/types/blocks-marathons"

interface DragDropMediaListProps {
  mediaItems: BlockMediaItem[]
  onReorder: (reorderedItems: BlockMediaItem[]) => void
  onFollowupChange: (mediaItemId: string, followupMediaId: string) => void
  showFollowup: boolean
}

export function DragDropMediaList({ mediaItems, onReorder, onFollowupChange, showFollowup }: DragDropMediaListProps) {
  const [draggedItem, setDraggedItem] = useState<BlockMediaItem | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const handleDragStart = (e: React.DragEvent, item: BlockMediaItem) => {
    setDraggedItem(item)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()

    if (!draggedItem) return

    const dragIndex = mediaItems.findIndex((item) => item.id === draggedItem.id)
    if (dragIndex === dropIndex) return

    const newItems = [...mediaItems]
    const [removed] = newItems.splice(dragIndex, 1)
    newItems.splice(dropIndex, 0, removed)

    onReorder(newItems)
    setDraggedItem(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    setDragOverIndex(null)
  }

  const formatRuntime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  return (
    <div className="space-y-2">
      {mediaItems.map((item, index) => (
        <div
          key={item.id}
          draggable
          onDragStart={(e) => handleDragStart(e, item)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          className={`flex items-center gap-3 p-3 border rounded-lg cursor-move transition-colors ${
            dragOverIndex === index ? "border-blue-300 bg-blue-50" : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <GripVerticalIcon className="h-5 w-5 text-gray-400" />

          <div className="flex-1">
            <div className="font-medium text-sm">{item.title}</div>
            <div className="text-xs text-gray-500">
              {item.mediaType} • {formatRuntime(item.runtime)}
            </div>
          </div>

          {showFollowup && (
            <div className="w-48">
              <Select
                value={item.followupMediaId || "none"} // Updated default value to be a non-empty string
                onValueChange={(value) => onFollowupChange(item.id, value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select followup" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No followup</SelectItem> // Updated value prop to be a non-empty string
                  {mediaItems
                    .filter((otherItem) => otherItem.id !== item.id)
                    .map((otherItem) => (
                      <SelectItem key={otherItem.id} value={otherItem.mediaId}>
                        {otherItem.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
