"use client"

import { useState, useEffect, useCallback } from "react"

export type LogLevel = "info" | "warn" | "error" | "debug"

export interface LogEntry {
  id: string
  timestamp: Date
  level: LogLevel
  category: string
  message: string
  details?: unknown
}

const STORAGE_KEY = "virtualTvLogs"
const MAX_LOGS = 1000 // Keep last 1000 log entries

// Global in-memory log store for the current session
let logEntries: LogEntry[] = []
let listeners: Set<() => void> = new Set()

// Check if logging is enabled from settings
const isLoggingEnabled = (): boolean => {
  if (typeof window === "undefined") return false
  try {
    const settings = localStorage.getItem("virtualTvSettings")
    if (settings) {
      const parsed = JSON.parse(settings)
      return parsed.loggingEnabled === true
    }
  } catch {
    // Ignore errors
  }
  return false
}

// Load logs from localStorage on init
const loadLogs = (): LogEntry[] => {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return parsed.map((entry: LogEntry) => ({
        ...entry,
        timestamp: new Date(entry.timestamp),
      }))
    }
  } catch {
    // Ignore errors
  }
  return []
}

// Save logs to localStorage
const saveLogs = () => {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logEntries))
  } catch {
    // Ignore storage errors
  }
}

// Initialize logs from storage
if (typeof window !== "undefined") {
  logEntries = loadLogs()
}

// Notify all listeners of log changes
const notifyListeners = () => {
  listeners.forEach((listener) => listener())
}

// Core logging function - can be called from anywhere
export const appLog = (
  level: LogLevel,
  category: string,
  message: string,
  details?: unknown
) => {
  if (!isLoggingEnabled()) return

  const entry: LogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    level,
    category,
    message,
    details,
  }

  logEntries = [...logEntries, entry].slice(-MAX_LOGS)
  saveLogs()
  notifyListeners()

  // Also log to console for development
  const consoleMethod = level === "error" ? console.error : level === "warn" ? console.warn : console.log
  consoleMethod(`[${category}] ${message}`, details ?? "")
}

// Convenience logging functions
export const logInfo = (category: string, message: string, details?: unknown) => 
  appLog("info", category, message, details)

export const logWarn = (category: string, message: string, details?: unknown) => 
  appLog("warn", category, message, details)

export const logError = (category: string, message: string, details?: unknown) => 
  appLog("error", category, message, details)

export const logDebug = (category: string, message: string, details?: unknown) => 
  appLog("debug", category, message, details)

// Clear all logs
export const clearLogs = () => {
  logEntries = []
  saveLogs()
  notifyListeners()
}

// Export logs as JSON file
export const exportLogs = () => {
  const data = JSON.stringify(logEntries, null, 2)
  const blob = new Blob([data], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `virtual-tv-logs-${new Date().toISOString().split("T")[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// React hook for consuming logs
export function useAppLogger() {
  const [logs, setLogs] = useState<LogEntry[]>(logEntries)

  useEffect(() => {
    // Subscribe to log changes
    const handleUpdate = () => {
      setLogs([...logEntries])
    }

    listeners.add(handleUpdate)
    
    // Initial sync
    setLogs([...logEntries])

    return () => {
      listeners.delete(handleUpdate)
    }
  }, [])

  const log = useCallback((level: LogLevel, category: string, message: string, details?: unknown) => {
    appLog(level, category, message, details)
  }, [])

  return {
    logs,
    log,
    logInfo: useCallback((category: string, message: string, details?: unknown) => logInfo(category, message, details), []),
    logWarn: useCallback((category: string, message: string, details?: unknown) => logWarn(category, message, details), []),
    logError: useCallback((category: string, message: string, details?: unknown) => logError(category, message, details), []),
    logDebug: useCallback((category: string, message: string, details?: unknown) => logDebug(category, message, details), []),
    clearLogs,
    exportLogs,
  }
}
