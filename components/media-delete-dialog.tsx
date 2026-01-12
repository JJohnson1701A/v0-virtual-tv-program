"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { MediaItem } from "@/types/media"

interface MediaDeleteDialogProps {
  item: MediaItem
  onConfirm: () => void
  onCancel: () => void
}

export function MediaDeleteDialog({ item, onConfirm, onCancel }: MediaDeleteDialogProps) {
  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {item.title}</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this{" "}
            {item.type === "movies"
              ? "movie"
              : item.type === "tvshows"
                ? "TV show"
                : item.type === "musicvideos"
                  ? "music video"
                  : item.type === "filler"
                    ? "filler"
                    : item.type === "podcasts"
                      ? "podcast"
                      : "livestream"}
            ? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
