"use client"

import type React from "react"

import { useState } from "react"
import { GripVerticalIcon } from "lucide-react"
import type { MarathonEpisode } from "@/types/blocks-marathons"

interface DragDropEpisodeListProps {
  episodes: MarathonEpisode[]
  onReorder: (reorderedEpisodes: MarathonEpisode[]) => void
}

export function DragDropEpisodeList({ episodes, onReorder }: DragDropEpisodeListProps) {
  const [draggedEpisode, setDraggedEpisode] = useState<MarathonEpisode | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const handleDragStart = (e: React.DragEvent, episode: MarathonEpisode) => {
    setDraggedEpisode(episode)
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

    if (!draggedEpisode) return

    const dragIndex = episodes.findIndex((ep) => ep.id === draggedEpisode.id)
    if (dragIndex === dropIndex) return

    const newEpisodes = [...episodes]
    const [removed] = newEpisodes.splice(dragIndex, 1)
    newEpisodes.splice(dropIndex, 0, removed)

    onReorder(newEpisodes)
    setDraggedEpisode(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedEpisode(null)
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
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {episodes.map((episode, index) => (
        <div
          key={episode.id}
          draggable
          onDragStart={(e) => handleDragStart(e, episode)}
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
            <div className="font-medium text-sm">{episode.title}</div>
            <div className="text-xs text-gray-500">{formatRuntime(episode.runtime)}</div>
          </div>

          <div className="text-xs text-gray-400 font-mono">#{index + 1}</div>
        </div>
      ))}
    </div>
  )
}
