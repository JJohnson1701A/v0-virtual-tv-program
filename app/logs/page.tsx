"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAppLogger, type LogLevel, type LogEntry } from "@/hooks/use-app-logger"
import { Download, Trash2, RefreshCw } from "lucide-react"

export default function LogsPage() {
  const router = useRouter()
  const { logs, clearLogs, exportLogs } = useAppLogger()
  const [levelFilter, setLevelFilter] = useState<LogLevel | "all">("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [isEnabled, setIsEnabled] = useState(false)

  // Check if logging is enabled
  useEffect(() => {
    try {
      const settings = localStorage.getItem("virtualTvSettings")
      if (settings) {
        const parsed = JSON.parse(settings)
        if (parsed.loggingEnabled !== true) {
          router.push("/settings")
          return
        }
        setIsEnabled(true)
      } else {
        router.push("/settings")
      }
    } catch {
      router.push("/settings")
    }
  }, [router])

  if (!isEnabled) {
    return null
  }

  // Get unique categories from logs
  const categories = Array.from(new Set(logs.map((log) => log.category))).sort()

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    if (levelFilter !== "all" && log.level !== levelFilter) return false
    if (categoryFilter !== "all" && log.category !== categoryFilter) return false
    return true
  })

  // Sort by newest first
  const sortedLogs = [...filteredLogs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case "error":
        return "destructive"
      case "warn":
        return "warning"
      case "info":
        return "default"
      case "debug":
        return "secondary"
      default:
        return "default"
    }
  }

  const formatTimestamp = (date: Date) => {
    return new Date(date).toLocaleString()
  }

  const formatDetails = (details: unknown): string => {
    if (details === undefined || details === null) return ""
    if (typeof details === "string") return details
    try {
      return JSON.stringify(details, null, 2)
    } catch {
      return String(details)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation activeTab="Logs" />

      <main className="flex-1 p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Application Logs</h1>
              <p className="text-muted-foreground">
                View program activity for diagnosing errors and understanding program logic.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={clearLogs}>
                <Trash2 className="mr-2 h-4 w-4" />
                Clear Logs
              </Button>
              <Button size="sm" onClick={exportLogs}>
                <Download className="mr-2 h-4 w-4" />
                Export Logs
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Log Entries</CardTitle>
              <CardDescription>
                {sortedLogs.length} of {logs.length} entries shown
              </CardDescription>
              <div className="flex items-center gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Level:</span>
                  <Select value={levelFilter} onValueChange={(v) => setLevelFilter(v as LogLevel | "all")}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="debug">Debug</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warn">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Category:</span>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {sortedLogs.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No log entries to display. Logs will appear here as you use the application.
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {sortedLogs.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-lg border p-3 text-sm font-mono bg-muted/30"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant={getLevelColor(log.level) as "default" | "destructive" | "outline" | "secondary"}>
                            {log.level.toUpperCase()}
                          </Badge>
                          <span className="text-muted-foreground text-xs">
                            {formatTimestamp(log.timestamp)}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {log.category}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-2 text-foreground">{log.message}</div>
                      {log.details && (
                        <pre className="mt-2 text-xs text-muted-foreground bg-background p-2 rounded overflow-x-auto">
                          {formatDetails(log.details)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
