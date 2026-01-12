"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useImportExport } from "@/hooks/use-import-export"
import { DownloadIcon, UploadIcon, LoaderIcon } from "lucide-react"

export function ImportExportButtons() {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { exportData, importData } = useImportExport()

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const exportFile = await exportData()

      // Create download link
      const blob = new Blob([JSON.stringify(exportFile, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `virtual-tv-backup-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Export Successful",
        description: "Your Virtual TV data has been exported successfully.",
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Export Failed",
        description: "There was an error exporting your data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    try {
      await importData(file)

      toast({
        title: "Import Successful",
        description: "Your Virtual TV data has been imported successfully. The page will reload to apply changes.",
      })

      // Reload the page to reflect imported data
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      console.error("Import error:", error)
      toast({
        title: "Import Failed",
        description: "There was an error importing your data. Please check the file format and try again.",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleExport}
        disabled={isExporting}
        className="flex items-center gap-2 bg-transparent"
      >
        {isExporting ? <LoaderIcon className="h-4 w-4 animate-spin" /> : <DownloadIcon className="h-4 w-4" />}
        Export
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleImportClick}
        disabled={isImporting}
        className="flex items-center gap-2 bg-transparent"
      >
        {isImporting ? <LoaderIcon className="h-4 w-4 animate-spin" /> : <UploadIcon className="h-4 w-4" />}
        Import
      </Button>

      <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileSelect} className="hidden" />
    </div>
  )
}
