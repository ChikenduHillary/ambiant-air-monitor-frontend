"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, CheckCircle2, Info, Trash2, Loader2, RefreshCw, Send, CheckCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { adminApi, type Alert } from "@/lib/api"

const LEVEL_STYLES = {
  warning: { border: "border-l-orange-500", bg: "bg-orange-500/5", icon: <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />, badge: "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400" },
  info:    { border: "border-l-primary",    bg: "bg-primary/5",    icon: <Info className="h-4 w-4 text-primary shrink-0" />,            badge: "border-primary/30 bg-primary/10 text-primary" },
  success: { border: "border-l-emerald-500",bg: "bg-emerald-500/5",icon: <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />,badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
}

function elapsed(iso: string) {
  const ms = Date.now() - new Date(iso).getTime()
  const m = Math.floor(ms / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function AdminAlerts() {
  const [alertList, setAlertList] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [level, setLevel] = useState<"warning" | "info" | "success">("info")
  const [broadcasting, setBroadcasting] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [markingAll, setMarkingAll] = useState(false)
  const [error, setError] = useState("")

  function load() {
    setLoading(true)
    adminApi.alerts(100)
      .then(setAlertList)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  async function broadcast() {
    if (!message.trim()) return
    setBroadcasting(true)
    try {
      const newAlert = await adminApi.broadcastAlert({ message: message.trim(), level })
      setAlertList((prev) => [newAlert, ...prev])
      setMessage("")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to broadcast")
    } finally {
      setBroadcasting(false)
    }
  }

  async function deleteAlert(id: number) {
    setDeletingId(id)
    try {
      await adminApi.deleteAlert(id)
      setAlertList((prev) => prev.filter((a) => a.id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete")
    } finally {
      setDeletingId(null)
    }
  }

  async function markAllRead() {
    setMarkingAll(true)
    try {
      await adminApi.markAllAlertsRead()
      setAlertList((prev) => prev.map((a) => ({ ...a, read: true })))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed")
    } finally {
      setMarkingAll(false)
    }
  }

  const unread = alertList.filter((a) => !a.read).length

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
      {/* Alert list */}
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Alert Management</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {alertList.length} total · <span className="text-orange-500 font-medium">{unread} unread</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unread > 0 && (
              <Button variant="outline" size="sm" onClick={markAllRead} disabled={markingAll} className="h-8 text-xs rounded-xl">
                {markingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <CheckCheck className="h-3.5 w-3.5 mr-1" />}
                Mark all read
              </Button>
            )}
            <button onClick={load} className="h-8 w-8 flex items-center justify-center rounded-xl border border-input hover:bg-muted transition-colors">
              <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-500/8 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>
        )}

        <Card className="border shadow-sm">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading…</div>
            ) : alertList.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">No alerts yet</div>
            ) : (
              <div className="divide-y divide-border">
                {alertList.map((a) => {
                  const s = LEVEL_STYLES[a.level]
                  return (
                    <div key={a.id} className={`flex items-start gap-3 px-4 py-3 ${a.read ? "opacity-60" : ""} hover:bg-muted/20 transition-colors`}>
                      <div className={`mt-0.5 border-l-2 pl-2 flex items-start gap-2 flex-1 min-w-0 ${s.border} ${s.bg} rounded-r-lg py-1 pr-2`}>
                        {s.icon}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground leading-snug">{a.message}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">{elapsed(a.created_at as unknown as string)}</span>
                            <Badge variant="outline" className={`text-[10px] font-semibold ${s.badge}`}>{a.level}</Badge>
                            {!a.read && <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteAlert(a.id)}
                        disabled={deletingId === a.id}
                        className="shrink-0 h-7 w-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        {deletingId === a.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Broadcast form */}
      <div>
        <Card className="border shadow-sm">
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="text-base font-semibold">Broadcast Alert</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">Send a system-wide alert to all users</p>
          </CardHeader>
          <CardContent className="px-5 pb-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Level</label>
              <div className="grid grid-cols-3 gap-2">
                {(["warning", "info", "success"] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLevel(l)}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold capitalize transition-all ${
                      level === l
                        ? l === "warning" ? "border-orange-500 bg-orange-500/10 text-orange-600"
                          : l === "info"    ? "border-primary bg-primary/10 text-primary"
                          : "border-emerald-500 bg-emerald-500/10 text-emerald-600"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Message</label>
              <textarea
                rows={4}
                placeholder="Air quality alert message for all users…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition resize-none"
              />
            </div>

            <Button
              onClick={broadcast}
              disabled={broadcasting || !message.trim()}
              className="h-10 rounded-xl font-semibold"
            >
              {broadcasting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Broadcast Alert
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
