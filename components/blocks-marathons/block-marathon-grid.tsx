"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Edit2Icon, Trash2Icon } from "lucide-react"
import type { Block, Marathon } from "@/types/blocks-marathons"

interface BlockMarathonGridProps {
  blocks: Block[]
  marathons: Marathon[]
  onEditBlock: (block: Block) => void
  onDeleteBlock: (blockId: string) => void
  onEditMarathon: (marathon: Marathon) => void
  onDeleteMarathon: (marathonId: string) => void
  zoomLevel: number
  isLoading: boolean
}

export function BlockMarathonGrid({
  blocks,
  marathons,
  onEditBlock,
  onDeleteBlock,
  onEditMarathon,
  onDeleteMarathon,
  zoomLevel,
  isLoading,
}: BlockMarathonGridProps) {
  const baseSize = 120
  const actualSize = (baseSize * zoomLevel) / 100

  if (isLoading) {
    return <div className="flex justify-center items-center h-full">Loading blocks and marathons...</div>
  }

  const allItems = [
    ...blocks.map((block) => ({ ...block, type: "block" as const })),
    ...marathons.map((marathon) => ({ ...marathon, type: "marathon" as const })),
  ]

  if (allItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No blocks or marathons created yet</h3>
        <p className="text-gray-500 mb-4">Create your first block or marathon to get started with programming.</p>
      </div>
    )
  }

  // Calculate grid columns based on zoom level and container width
  const minColumns = 5
  const maxColumns = 10
  const containerWidth = 1200 // Approximate container width
  const itemWidth = actualSize + 32 // Size + margins
  const calculatedColumns = Math.floor(containerWidth / itemWidth)
  const columns = Math.max(minColumns, Math.min(maxColumns, calculatedColumns))

  return (
    <div
      className="grid gap-4 auto-rows-max"
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
      }}
    >
      {allItems.map((item) => (
        <div key={`${item.type}-${item.id}`} className="flex flex-col items-center group">
          <div
            className="relative border-2 border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow group-hover:border-gray-300"
            style={{
              width: actualSize,
              height: actualSize,
            }}
          >
            {item.logo ? (
              <Image
                src={item.logo || "/placeholder.svg"}
                alt={`${item.name} logo`}
                fill
                className="object-cover"
                sizes={`${actualSize}px`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                <div className="text-center">
                  <div className="text-xs font-bold mb-1">{item.type.toUpperCase()}</div>
                  <div className="text-xs">No Logo</div>
                </div>
              </div>
            )}

            {/* Type Badge */}
            <div
              className={`absolute top-2 left-2 text-white text-xs px-2 py-1 rounded ${
                item.type === "block" ? "bg-purple-600" : "bg-orange-600"
              }`}
            >
              {item.type === "block" ? "Block" : "Marathon"}
            </div>

            {/* Action Buttons */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <Button
                size="sm"
                variant="secondary"
                className="h-6 w-6 p-0"
                onClick={() => (item.type === "block" ? onEditBlock(item as Block) : onEditMarathon(item as Marathon))}
              >
                <Edit2Icon className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-6 w-6 p-0"
                onClick={() => (item.type === "block" ? onDeleteBlock(item.id) : onDeleteMarathon(item.id))}
              >
                <Trash2Icon className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Item Name and Details */}
          <div className="mt-2 text-center">
            <div className="font-medium text-sm truncate max-w-full" title={item.name}>
              {item.name}
            </div>
            <div className="text-xs text-gray-500">
              {item.duration} • {item.occurrence}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
