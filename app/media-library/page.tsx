"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { MediaSidebar } from "@/components/media-sidebar"
import { MediaGrid } from "@/components/media-grid"
import { MediaEditDialog } from "@/components/media-edit-dialog"
import { MediaDeleteDialog } from "@/components/media-delete-dialog"
import { ImportExportButtons } from "@/components/import-export-buttons"
import { useMediaLibrary } from "@/hooks/use-media-library"
import { Separator } from "@/components/ui/separator"
import type { MediaItem, MediaType } from "@/types/media"

export default function MediaLibraryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentType = (searchParams.get("type") as MediaType) || "movies"
  const sortOrder = searchParams.get("sort") || "a-z"

  const { mediaItems, addMediaItem, updateMediaItem, deleteMediaItem, isLoading } = useMediaLibrary(
    currentType,
    sortOrder,
  )

  const [editItem, setEditItem] = useState<MediaItem | null>(null)
  const [deleteItem, setDeleteItem] = useState<MediaItem | null>(null)

  const handleSort = (sort: string) => {
    router.push(`/media-library?type=${currentType}&sort=${sort}`)
  }

  const handleTypeChange = (type: MediaType) => {
    router.push(`/media-library?type=${type}&sort=${sortOrder}`)
  }

  const handleEdit = (item: MediaItem) => {
    setEditItem(item)
  }

  const handleDelete = (item: MediaItem) => {
    setDeleteItem(item)
  }

  const handleAddMedia = (type: MediaType) => {
    // Create a new empty media item of the specified type
    const newItem: MediaItem = {
      id: `temp-${Date.now()}`,
      type,
      title: "New Media",
      year: new Date().getFullYear(),
      poster: "",
      files: [],
      dateAdded: new Date().toISOString(),
    }
    setEditItem(newItem)
  }

  return (
    <div className="flex flex-col h-screen">
      <Navigation activeTab="Media Library" />

      <div className="flex flex-1 overflow-hidden">
        <MediaSidebar activeType={currentType} onTypeChange={handleTypeChange} onAddMedia={handleAddMedia} />

        <div className="flex-1 flex flex-col">
          <div className="p-2 border-b">
            <div className="flex justify-between items-center mb-2">
              <div className="flex gap-2">
                <button
                  onClick={() => handleSort("a-z")}
                  className={`px-3 py-1 rounded ${sortOrder === "a-z" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                >
                  A-Z
                </button>
                <button
                  onClick={() => handleSort("z-a")}
                  className={`px-3 py-1 rounded ${sortOrder === "z-a" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                >
                  Z-A
                </button>
                <button
                  onClick={() => handleSort("year")}
                  className={`px-3 py-1 rounded ${sortOrder === "year" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                >
                  Year
                </button>
              </div>

              <ImportExportButtons />
            </div>
            <Separator />
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <MediaGrid items={mediaItems} onEdit={handleEdit} onDelete={handleDelete} isLoading={isLoading} />
          </div>
        </div>
      </div>

      {editItem && (
        <MediaEditDialog
          item={editItem}
          onSave={(updatedItem) => {
            if (updatedItem.id.startsWith("temp-")) {
              addMediaItem(updatedItem)
            } else {
              updateMediaItem(updatedItem)
            }
            setEditItem(null)
          }}
          onCancel={() => setEditItem(null)}
        />
      )}

      {deleteItem && (
        <MediaDeleteDialog
          item={deleteItem}
          onConfirm={() => {
            deleteMediaItem(deleteItem.id)
            setDeleteItem(null)
          }}
          onCancel={() => setDeleteItem(null)}
        />
      )}
    </div>
  )
}
