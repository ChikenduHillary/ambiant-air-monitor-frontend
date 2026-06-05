"use client"

import { useEffect, useState } from "react"
import { Users, Activity, Bell, Heart, TrendingUp, Wifi, RefreshCw, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { adminApi, type AdminStats } from "@/lib/api"

function StatCard({
  label, value, sub, icon: Icon, iconColor, accent, loading,
}: {
  label: string; value: string | number; sub?: string
  icon: React.ElementType; iconColor: string; accent: string; loading?: boolean
}) {
  return (
    <Card className="border shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`h-10 w-10 rounded-xl ${accent} flex items-center justify-center`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
        </div>
        {loading ? <Skeleton className="h-8 w-20 mb-1" /> : <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>}
        <p className="text-sm font-medium text-foreground mt-0.5">{label}</p>
        {sub && (loading ? <Skeleton className="h-3 w-24 mt-0.5" /> : <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>)}
      </CardContent>
    </Card>
  )
}

function elapsed(iso: string | null) {
  if (!iso) return "No data"
  const ms = Date.now() - new Date(iso).getTime()
  const m = Math.floor(ms / 60000)
  if (m < 1) return "Just now"
  if (m < 60) return `${m}m ago`
  return `${Math.floor(m / 60)}h ago`
}

export function AdminOverview() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  function load() {
    setLoading(true)
    adminApi.stats()
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  if (error) return (
    <div className="flex items-center gap-2 text-muted-foreground text-sm justify-center h-48">
      <RefreshCw className="h-4 w-4" /> {error}
    </div>
  )

  const s = stats

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">System Overview</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Live statistics across all users and devices</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users"     value={s?.total_users ?? 0}    loading={loading} icon={Users}    iconColor="text-primary"      accent="bg-primary/10" />
        <StatCard label="Sensor Readings" value={s?.total_readings ?? 0} loading={loading} icon={Activity} iconColor="text-emerald-500" accent="bg-emerald-500/10" />
        <StatCard label="Active Alerts"   value={s?.active_alerts ?? 0}  loading={loading} icon={Bell}     iconColor="text-orange-500"  accent="bg-orange-500/10"
          sub={`${s?.total_alerts ?? 0} total`} />
        <StatCard label="Symptom Events"  value={s?.total_symptoms ?? 0} loading={loading} icon={Heart}    iconColor="text-rose-500"    accent="bg-rose-500/10" />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Avg AQI */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Avg AQI — Last 24h</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {loading ? (
              <div className="flex items-end gap-3 pt-2">
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-6 w-20 mb-1 rounded-full" />
              </div>
            ) : (
              <div className="flex items-end gap-3">
                <span className="text-4xl font-bold tabular-nums" style={{
                  color: (s?.avg_aqi_today ?? 0) > 100 ? "#f97316" : (s?.avg_aqi_today ?? 0) > 75 ? "#f59e0b" : "#34d399"
                }}>
                  {s?.avg_aqi_today?.toFixed(0) ?? "—"}
                </span>
                <Badge variant="outline" className={`mb-1 ${
                  (s?.avg_aqi_today ?? 0) > 100 ? "border-orange-500/30 bg-orange-500/10 text-orange-600" :
                  (s?.avg_aqi_today ?? 0) > 75  ? "border-amber-500/30  bg-amber-500/10  text-amber-600"  :
                                                   "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                }`}>
                  {(s?.avg_aqi_today ?? 0) > 100 ? "Unhealthy" : (s?.avg_aqi_today ?? 0) > 75 ? "Moderate" : "Good"}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System status */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">System Status</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 flex flex-col gap-3">
            {[
              { label: "API Server",         status: "Operational", ok: true,  icon: TrendingUp },
              { label: "Sensor Simulator",   status: "Running",     ok: true,  icon: Wifi },
              { label: "Last Data Received", status: elapsed(s?.last_reading_at ?? null), ok: !!s?.last_reading_at, icon: Clock },
            ].map(({ label, status, ok, icon: Icon }) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">{label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${ok ? "bg-emerald-500" : "bg-orange-500"}`} />
                  <span className="font-medium text-foreground text-xs">{status}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick facts */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Quick Facts</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 flex flex-col gap-3 text-sm">
            {[
              { label: "Readings / user",   value: s && s.total_users > 0 ? Math.round(s.total_readings / s.total_users).toLocaleString() : "—" },
              { label: "Alerts / user",     value: s && s.total_users > 0 ? (s.total_alerts / s.total_users).toFixed(1) : "—" },
              { label: "Symptom rate",      value: s && s.total_users > 0 ? `${(s.total_symptoms / s.total_users).toFixed(1)}/user` : "—" },
              { label: "Unread alert rate", value: s && s.total_alerts > 0 ? `${Math.round((s.active_alerts / s.total_alerts) * 100)}%` : "—" },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-muted-foreground">{label}</span>
                {loading ? <Skeleton className="h-4 w-14" /> : <span className="font-semibold tabular-nums text-foreground">{value}</span>}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
