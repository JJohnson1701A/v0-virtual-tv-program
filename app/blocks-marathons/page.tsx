"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { BlockMarathonGrid } from "@/components/blocks-marathons/block-marathon-grid"
import { CreateBlockDialog } from "@/components/blocks-marathons/create-block-dialog"
import { CreateMarathonDialog } from "@/components/blocks-marathons/create-marathon-dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { useBlocksMarathons } from "@/hooks/use-blocks-marathons"
import { PlusIcon } from "lucide-react"
import type { Block, Marathon } from "@/types/blocks-marathons"

export default function BlocksMarathonsPage() {
  const {
    blocks,
    marathons,
    addBlock,
    updateBlock,
    deleteBlock,
    addMarathon,
    updateMarathon,
    deleteMarathon,
    isLoading,
  } = useBlocksMarathons()
  const [showCreateBlockDialog, setShowCreateBlockDialog] = useState(false)
  const [showCreateMarathonDialog, setShowCreateMarathonDialog] = useState(false)
  const [editBlock, setEditBlock] = useState<Block | null>(null)
  const [editMarathon, setEditMarathon] = useState<Marathon | null>(null)
  const [zoomLevel, setZoomLevel] = useState([100])

  const handleCreateBlock = () => {
    setEditBlock(null)
    setShowCreateBlockDialog(true)
  }

  const handleCreateMarathon = () => {
    setEditMarathon(null)
    setShowCreateMarathonDialog(true)
  }

  const handleEditBlock = (block: Block) => {
    setEditBlock(block)
    setShowCreateBlockDialog(true)
  }

  const handleEditMarathon = (marathon: Marathon) => {
    setEditMarathon(marathon)
    setShowCreateMarathonDialog(true)
  }

  const handleSaveBlock = (blockData: Omit<Block, "id" | "dateCreated">) => {
    if (editBlock) {
      updateBlock({ ...editBlock, ...blockData })
    } else {
      addBlock(blockData)
    }
    setShowCreateBlockDialog(false)
    setEditBlock(null)
  }

  const handleSaveMarathon = (marathonData: Omit<Marathon, "id" | "dateCreated">) => {
    if (editMarathon) {
      updateMarathon({ ...editMarathon, ...marathonData })
    } else {
      addMarathon(marathonData)
    }
    setShowCreateMarathonDialog(false)
    setEditMarathon(null)
  }

  const handleCancelCreate = () => {
    setShowCreateBlockDialog(false)
    setShowCreateMarathonDialog(false)
    setEditBlock(null)
    setEditMarathon(null)
  }

  return (
    <div className="flex flex-col h-screen">
      <Navigation activeTab="Blocks-Marathons" />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Button Row */}
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex gap-2">
            <Button onClick={handleCreateBlock} className="flex items-center gap-2">
              <PlusIcon className="h-4 w-4" />
              Add Block
            </Button>
            <Button onClick={handleCreateMarathon} className="flex items-center gap-2">
              <PlusIcon className="h-4 w-4" />
              Add Marathon
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <Label htmlFor="zoom-slider" className="text-sm font-medium">
              Zoom
            </Label>
            <div className="w-32">
              <Slider
                id="zoom-slider"
                min={50}
                max={150}
                step={10}
                value={zoomLevel}
                onValueChange={setZoomLevel}
                className="w-full"
              />
            </div>
            <span className="text-sm text-muted-foreground w-12">{zoomLevel[0]}%</span>
          </div>
        </div>

        {/* Blocks and Marathons Grid */}
        <div className="flex-1 overflow-auto p-4">
          <BlockMarathonGrid
            blocks={blocks}
            marathons={marathons}
            onEditBlock={handleEditBlock}
            onDeleteBlock={deleteBlock}
            onEditMarathon={handleEditMarathon}
            onDeleteMarathon={deleteMarathon}
            zoomLevel={zoomLevel[0]}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Create/Edit Block Dialog */}
      {showCreateBlockDialog && (
        <CreateBlockDialog block={editBlock} onSave={handleSaveBlock} onCancel={handleCancelCreate} />
      )}

      {/* Create/Edit Marathon Dialog */}
      {showCreateMarathonDialog && (
        <CreateMarathonDialog marathon={editMarathon} onSave={handleSaveMarathon} onCancel={handleCancelCreate} />
      )}
    </div>
  )
}
