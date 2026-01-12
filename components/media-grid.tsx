"use client"

import Image from "next/image"
import { Edit2Icon, Trash2Icon } from "lucide-react"
import type { MediaItem } from "@/types/media"

interface MediaGridProps {
  items: MediaItem[]
  onEdit: (item: MediaItem) => void
  onDelete: (item: MediaItem) => void
  isLoading: boolean
}

export function MediaGrid({ items, onEdit, onDelete, isLoading }: MediaGridProps) {
  if (isLoading) {
    return <div className="flex justify-center items-center h-full">Loading...</div>
  }

  if (items.length === 0) {
    return (
      <div className="flex justify-center items-center h-full text-gray-500">
        No media items found. Click the + button to add some.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
      {items.map((item) => (
        <div key={item.id} className="flex flex-col">
          <div className="relative border aspect-[3/4] bg-white">
            {item.poster ? (
              <Image src={item.poster || "/placeholder.svg"} alt={item.title} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">No Poster</div>
            )}
          </div>
          <div className="mt-2">
            <div className="font-medium truncate">{item.title}</div>
            <div className="text-sm text-gray-500">{item.year}</div>
          </div>
          <div className="flex mt-1 gap-2">
            <button onClick={() => onEdit(item)} className="p-1 hover:bg-gray-100 rounded" aria-label="Edit">
              <Edit2Icon size={16} />
            </button>
            <button onClick={() => onDelete(item)} className="p-1 hover:bg-gray-100 rounded" aria-label="Delete">
              <Trash2Icon size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
