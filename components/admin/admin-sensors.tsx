"use client"

import { useEffect, useState } from "react"
import { Download, Trash2, Loader2, RefreshCw, Filter } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { adminApi, getToken, type SensorReading } from "@/lib/api"

function aqiBadge(aqi: number) {
  if (aqi <= 50)  return <Badge variant="outline" className="text-[10px] border-emerald-500/30 bg-emerald-500/10 text-emerald-600">Good</Badge>
  if (aqi <= 100) return <Badge variant="outline" className="text-[10px] border-amber-500/30  bg-amber-500/10  text-amber-600">Moderate</Badge>
  if (aqi <= 150) return <Badge variant="outline" className="text-[10px] border-orange-500/30 bg-orange-500/10 text-orange-600">Sensitive</Badge>
  return              <Badge variant="outline" className="text-[10px] border-red-500/30    bg-red-500/10    text-red-600">Unhealthy</Badge>
}

export function AdminSensors() {
  const [readings, setReadings] = useState<SensorReading[]>([])
  const [loading, setLoading] = useState(true)
  const [limit, setLimit] = useState(100)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error, setError] = useState("")

  function load() {
    setLoading(true)
    adminApi.sensors(limit)
      .then(setReadings)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [limit])

  async function deleteReading(id: number) {
    if (!confirm("Delete this reading?")) return
    setDeletingId(id)
    try {
      await adminApi.deleteReading(id)
      setReadings((prev) => prev.filter((r) => r.id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete")
    } finally {
      setDeletingId(null)
    }
  }

  function exportCSV() {
    const token = getToken()
    const url = adminApi.exportUrl() + (token ? `?token=${token}` : "")
    window.open(url, "_blank")
  }

  // Summary stats
  const avg = (key: keyof SensorReading) =>
    readings.length ? (readings.reduce((s, r) => s + (r[key] as number), 0) / readings.length).toFixed(1) : "—"
  const max = (key: keyof SensorReading) =>
    readings.length ? Math.max(...readings.map((r) => r[key] as number)).toFixed(1) : "—"

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Sensor Data</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Showing last {limit} readings</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
            {[50, 100, 200].map((n) => (
              <button
                key={n}
                onClick={() => setLimit(n)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  limit === n ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <button onClick={load} className="h-9 w-9 flex items-center justify-center rounded-xl border border-input hover:bg-muted transition-colors">
            <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
          </button>
          <Button variant="outline" size="sm" onClick={exportCSV} className="h-9 rounded-xl text-xs gap-1.5">
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-500/8 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>
      )}

      {/* Summary stats */}
      {!loading && readings.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Avg PM2.5",  value: `${avg("pm25")} µg/m³` },
            { label: "Max PM2.5",  value: `${max("pm25")} µg/m³` },
            { label: "Avg AQI",    value: avg("aqi") },
            { label: "Max AQI",    value: max("aqi") },
          ].map(({ label, value }) => (
            <Card key={label} className="border shadow-sm">
              <CardContent className="p-3">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
                <p className="text-lg font-bold text-foreground tabular-nums mt-0.5">{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="border shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Timestamp", "PM2.5", "VOC", "Temp", "Humidity", "AQI", ""].map((h, i) => (
                    <th key={i} className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/50">
                      {Array.from({ length: 7 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : readings.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-muted-foreground text-sm">No readings found</td></tr>
                ) : readings.map((r) => (
                  <tr key={r.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-muted-foreground font-mono">
                      {new Date(r.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`font-semibold tabular-nums ${r.pm25 > 35 ? "text-orange-500" : "text-foreground"}`}>
                        {r.pm25.toFixed(1)}
                      </span>
                      <span className="text-[10px] text-muted-foreground ml-1">µg/m³</span>
                    </td>
                    <td className="px-4 py-2.5 tabular-nums text-foreground">{r.voc.toFixed(0)} <span className="text-[10px] text-muted-foreground">ppm</span></td>
                    <td className="px-4 py-2.5 tabular-nums text-foreground">{r.temperature.toFixed(1)}°C</td>
                    <td className="px-4 py-2.5 tabular-nums text-foreground">{r.humidity.toFixed(0)}%</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold tabular-nums text-foreground">{r.aqi}</span>
                        {aqiBadge(r.aqi)}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => deleteReading(r.id)}
                        disabled={deletingId === r.id}
                        className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        {deletingId === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
