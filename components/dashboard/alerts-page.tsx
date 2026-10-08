"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { AlertTriangle, CheckCircle2, TrendingUp, Clock, Bell, RefreshCw } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { alerts as alertsApi, type Alert } from "@/lib/api"

function elapsed(iso: string) {
  const ms = Date.now() - new Date(iso).getTime()
  const m = Math.floor(ms / 60000)
  if (m < 1) return "Just now"
  if (m < 60) return `${m} min ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} hr ago`
  return `${Math.floor(h / 24)} d ago`
}

const LEVEL_STYLES = {
  warning: { border: "border-l-orange-500", bg: "bg-orange-500/5", icon: <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" /> },
  info: { border: "border-l-primary", bg: "bg-primary/5", icon: <TrendingUp className="h-4 w-4 text-primary shrink-0 mt-0.5" /> },
  success: { border: "border-l-emerald-500", bg: "bg-emerald-500/5", icon: <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> },
} as const

export function AlertsPage() {
  const [alertList, setAlertList] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  async function load() {
    try {
      setAlertList(await alertsApi.list(50))
      setError("")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load alerts")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 30_000)
    return () => clearInterval(id)
  }, [])

  async function markRead(id: number) {
    setAlertList((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)))
    try {
      await alertsApi.markRead(id)
    } catch {
      toast.error("Couldn't mark as read — try again")
      load()
    }
  }

  const unread = alertList.filter((a) => !a.read)
  const read = alertList.filter((a) => a.read)

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm gap-2">
        <RefreshCw className="h-4 w-4" /> {error}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border shadow-sm">
            <CardContent className="p-4 flex gap-3">
              <Skeleton className="h-4 w-4 rounded-full shrink-0 mt-0.5" />
              <div className="flex-1 flex flex-col gap-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (alertList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground animate-in fade-in duration-300">
        <Bell className="h-12 w-12 opacity-30" />
        <p className="text-sm">No alerts yet</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {unread.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold text-foreground">Unread</h3>
            <Badge variant="outline" className="text-xs font-medium bg-orange-500/10 text-orange-600 border-orange-500/30 dark:text-orange-400">
              {unread.length}
            </Badge>
          </div>
          <div className="flex flex-col gap-2">
            {unread.map((a) => {
              const s = LEVEL_STYLES[a.level]
              return (
                <Card
                  key={a.id}
                  className={`border-0 border-l-2 shadow-sm cursor-pointer hover:shadow-md transition-shadow animate-in fade-in slide-in-from-top-1 duration-300 ${s.border} ${s.bg}`}
                  onClick={() => markRead(a.id)}
                >
                  <CardContent className="p-4 flex gap-3">
                    {s.icon}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{a.message}</p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {elapsed(a.created_at)}
                      </p>
                    </div>
                    <span className="h-2 w-2 rounded-full bg-orange-500 shrink-0 mt-1.5" />
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {read.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Earlier</h3>
          <div className="flex flex-col gap-2">
            {read.map((a) => {
              const s = LEVEL_STYLES[a.level]
              return (
                <Card key={a.id} className={`border-0 border-l-2 shadow-sm opacity-60 ${s.border} ${s.bg}`}>
                  <CardContent className="p-4 flex gap-3">
                    {s.icon}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{a.message}</p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {elapsed(a.created_at)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
