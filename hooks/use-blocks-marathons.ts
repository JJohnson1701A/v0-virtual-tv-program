"use client"

import { useState, useEffect } from "react"
import type { Block, Marathon } from "@/types/blocks-marathons"

export function useBlocksMarathons() {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [marathons, setMarathons] = useState<Marathon[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load blocks and marathons from storage
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const storedBlocks = localStorage.getItem("virtualTvBlocks")
        const storedMarathons = localStorage.getItem("virtualTvMarathons")

        const blocksData: Block[] = storedBlocks ? JSON.parse(storedBlocks) : []
        const marathonsData: Marathon[] = storedMarathons ? JSON.parse(storedMarathons) : []

        setBlocks(blocksData)
        setMarathons(marathonsData)
      } catch (error) {
        console.error("Error loading blocks and marathons:", error)
        setBlocks([])
        setMarathons([])
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Save blocks to storage
  const saveBlocks = (blocksData: Block[]) => {
    try {
      localStorage.setItem("virtualTvBlocks", JSON.stringify(blocksData))
    } catch (error) {
      console.error("Error saving blocks:", error)
    }
  }

  // Save marathons to storage
  const saveMarathons = (marathonsData: Marathon[]) => {
    try {
      localStorage.setItem("virtualTvMarathons", JSON.stringify(marathonsData))
    } catch (error) {
      console.error("Error saving marathons:", error)
    }
  }

  // Add a new block
  const addBlock = (blockData: Omit<Block, "id" | "dateCreated">) => {
    const newBlock: Block = {
      ...blockData,
      id: `block-${Date.now()}`,
      dateCreated: new Date().toISOString(),
    }

    const updatedBlocks = [...blocks, newBlock]
    setBlocks(updatedBlocks)
    saveBlocks(updatedBlocks)

    return newBlock
  }

  // Update an existing block
  const updateBlock = (updatedBlock: Block) => {
    const updatedBlocks = blocks.map((block) => (block.id === updatedBlock.id ? updatedBlock : block))
    setBlocks(updatedBlocks)
    saveBlocks(updatedBlocks)
  }

  // Delete a block
  const deleteBlock = (blockId: string) => {
    const updatedBlocks = blocks.filter((block) => block.id !== blockId)
    setBlocks(updatedBlocks)
    saveBlocks(updatedBlocks)
  }

  // Add a new marathon
  const addMarathon = (marathonData: Omit<Marathon, "id" | "dateCreated">) => {
    const newMarathon: Marathon = {
      ...marathonData,
      id: `marathon-${Date.now()}`,
      dateCreated: new Date().toISOString(),
    }

    const updatedMarathons = [...marathons, newMarathon]
    setMarathons(updatedMarathons)
    saveMarathons(updatedMarathons)

    return newMarathon
  }

  // Update an existing marathon
  const updateMarathon = (updatedMarathon: Marathon) => {
    const updatedMarathons = marathons.map((marathon) =>
      marathon.id === updatedMarathon.id ? updatedMarathon : marathon,
    )
    setMarathons(updatedMarathons)
    saveMarathons(updatedMarathons)
  }

  // Delete a marathon
  const deleteMarathon = (marathonId: string) => {
    const updatedMarathons = marathons.filter((marathon) => marathon.id !== marathonId)
    setMarathons(updatedMarathons)
    saveMarathons(updatedMarathons)
  }

  return {
    blocks,
    marathons,
    addBlock,
    updateBlock,
    deleteBlock,
    addMarathon,
    updateMarathon,
    deleteMarathon,
    isLoading,
  }
}
