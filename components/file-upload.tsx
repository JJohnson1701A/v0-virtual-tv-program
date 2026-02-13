"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { UploadIcon, XIcon } from "lucide-react"

interface FileUploadProps {
  value: string
  onChange: (value: string) => void
  accept: string
  placeholder: string
}

export function FileUpload({ value, onChange, accept, placeholder }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    // Convert file to a persistent data URL so it survives page reloads
    // and can be exported/imported reliably
    const reader = new FileReader()
    reader.onload = () => {
      onChange(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleClear = () => {
    onChange("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-2">
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
          isDragging ? "border-primary bg-primary/10" : "border-border hover:border-muted-foreground/40"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {value ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {accept.startsWith("image/") && (
                <img src={value || "/placeholder.svg"} alt="Preview" className="w-8 h-8 object-cover rounded" />
              )}
              <span className="text-sm text-gray-600 truncate">File selected</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClear}>
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <UploadIcon className="h-8 w-8 mx-auto text-gray-400" />
            <div className="text-sm text-gray-600">{placeholder}</div>
            <div className="text-xs text-gray-500">Drag and drop or click to browse</div>
          </div>
        )}
      </div>

      <input ref={fileInputRef} type="file" accept={accept} onChange={handleFileInputChange} className="hidden" />

      {!value && (
        <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full">
          <UploadIcon className="h-4 w-4 mr-2" />
          Browse Files
        </Button>
      )}
    </div>
  )
}
