"use client"

import { useEffect, useState } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import { Wind, FlaskConical, Thermometer, Droplets, Wifi, TrendingUp, TrendingDown, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { sensors, type SensorReading } from "@/lib/api"

function formatTime(iso: string) {
  const d = new Date(iso)
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ color: string; name: string; value: number }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2.5 shadow-xl text-xs">
      <p className="font-medium text-muted-foreground mb-1.5">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-foreground font-semibold">{p.value}</span>
          <span className="text-muted-foreground">{p.name}</span>
        </div>
      ))}
    </div>
  )
}

interface BigReading {
  label: string
  value: string
  unit: string
  trend: "up" | "down" | "stable"
  delta: string
  icon: React.ElementType
  color: string
  bg: string
  status: string
  statusColor: string
  safe: string
}

function buildBigReadings(cur: SensorReading, prev: SensorReading): BigReading[] {
  const pm25Trend = cur.pm25 > prev.pm25 + 0.5 ? "up" : cur.pm25 < prev.pm25 - 0.5 ? "down" : "stable"
  const tempTrend = cur.temperature > prev.temperature + 0.1 ? "up" : cur.temperature < prev.temperature - 0.1 ? "down" : "stable"
  const humTrend = cur.humidity > prev.humidity + 0.5 ? "up" : cur.humidity < prev.humidity - 0.5 ? "down" : "stable"

  return [
    {
      label: "PM2.5",
      value: cur.pm25.toFixed(1),
      unit: "µg/m³",
      trend: pm25Trend,
      delta: `${cur.pm25 > prev.pm25 ? "+" : ""}${(cur.pm25 - prev.pm25).toFixed(1)}`,
      icon: Wind,
      color: "#f97316",
      bg: "bg-orange-500/10",
      status: cur.pm25 > 35 ? "High" : cur.pm25 > 20 ? "Moderate" : "Good",
      statusColor: cur.pm25 > 35
        ? "bg-red-500/15 text-red-600 border-red-500/30"
        : cur.pm25 > 20
          ? "bg-amber-500/15 text-amber-600 border-amber-500/30"
          : "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
      safe: "< 35",
    },
    {
      label: "VOC / CO₂",
      value: cur.voc.toFixed(0),
      unit: "ppm",
      trend: "stable",
      delta: `${cur.voc > prev.voc ? "+" : ""}${(cur.voc - prev.voc).toFixed(0)}`,
      icon: FlaskConical,
      color: "oklch(0.55 0.16 196)",
      bg: "bg-primary/10",
      status: cur.voc > 1000 ? "High" : cur.voc > 600 ? "Moderate" : "Good",
      statusColor: cur.voc > 1000
        ? "bg-red-500/15 text-red-600 border-red-500/30"
        : cur.voc > 600
          ? "bg-amber-500/15 text-amber-600 border-amber-500/30"
          : "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
      safe: "< 1000",
    },
    {
      label: "Temperature",
      value: cur.temperature.toFixed(1),
      unit: "°C",
      trend: tempTrend,
      delta: `${cur.temperature > prev.temperature ? "+" : ""}${(cur.temperature - prev.temperature).toFixed(1)}`,
      icon: Thermometer,
      color: "#22c55e",
      bg: "bg-emerald-500/10",
      status: cur.temperature > 28 || cur.temperature < 16 ? "Caution" : "Optimal",
      statusColor: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
      safe: "18–26",
    },
    {
      label: "Humidity",
      value: cur.humidity.toFixed(0),
      unit: "%",
      trend: humTrend,
      delta: `${cur.humidity > prev.humidity ? "+" : ""}${(cur.humidity - prev.humidity).toFixed(0)}`,
      icon: Droplets,
      color: "#3b82f6",
      bg: "bg-blue-500/10",
      status: cur.humidity > 65 || cur.humidity < 30 ? "Caution" : "Good",
      statusColor: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
      safe: "40–65",
    },
  ]
}

const chartDefs = [
  { key: "pm25",        label: "PM2.5",     color: "#f97316",              unit: "µg/m³", refLine: 35 },
  { key: "voc",         label: "VOC / CO₂", color: "oklch(0.55 0.16 196)", unit: "ppm",   refLine: 1000 },
  { key: "aqi",         label: "AQI",       color: "#a855f7",              unit: "",      refLine: 100 },
] as const

export function LiveReadings() {
  const [history, setHistory] = useState<SensorReading[]>([])
  const [current, setCurrent] = useState<SensorReading | null>(null)
  const [prev, setPrev] = useState<SensorReading | null>(null)
  const [error, setError] = useState("")
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [cur, hourly] = await Promise.all([sensors.current(), sensors.hourly()])
        if (cancelled) return
        setPrev(current)
        setCurrent(cur)
        setHistory(hourly)
        setLastUpdated(new Date())
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load data")
      }
    }
    load()
    const id = setInterval(load, 30_000)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  const chartData = history.map((r) => ({
    time: formatTime(r.timestamp),
    pm25: r.pm25,
    voc: r.voc,
    aqi: r.aqi,
  }))

  const bigReadings = current && prev ? buildBigReadings(current, prev) : []

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm gap-2">
        <RefreshCw className="h-4 w-4" />
        {error}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Live badge */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <Wifi className="h-3.5 w-3.5 text-emerald-600" />
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Live · Updating every 30s</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {lastUpdated
            ? `Updated at ${lastUpdated.toLocaleTimeString()}`
            : "Loading…"}
        </span>
      </div>

      {/* Big reading cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {bigReadings.length === 0
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border shadow-sm">
                <CardContent className="p-5 h-36 flex items-center justify-center text-muted-foreground text-sm">
                  Loading…
                </CardContent>
              </Card>
            ))
          : bigReadings.map((r) => {
              const Icon = r.icon
              return (
                <Card key={r.label} className="border shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`h-10 w-10 rounded-xl ${r.bg} flex items-center justify-center`}>
                        <Icon className="h-5 w-5" style={{ color: r.color }} />
                      </div>
                      <Badge variant="outline" className={`text-[10px] font-semibold ${r.statusColor}`}>
                        {r.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{r.label}</p>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-3xl font-bold tabular-nums" style={{ color: r.color }}>{r.value}</span>
                      <span className="text-sm text-muted-foreground">{r.unit}</span>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-1 text-xs">
                        {r.trend === "up"
                          ? <TrendingUp className="h-3.5 w-3.5 text-orange-500" />
                          : r.trend === "down"
                            ? <TrendingDown className="h-3.5 w-3.5 text-emerald-500" />
                            : <span className="h-3.5 w-3.5 inline-flex items-center justify-center text-muted-foreground">—</span>
                        }
                        <span className={r.trend === "up" ? "text-orange-500 font-medium" : r.trend === "down" ? "text-emerald-500 font-medium" : "text-muted-foreground"}>
                          {r.delta}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">Safe: {r.safe}</span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-5">
        {chartDefs.map((line) => (
          <Card key={line.key} className="border shadow-sm">
            <CardHeader className="pb-2 pt-5 px-5">
              <CardTitle className="flex items-center justify-between text-sm font-semibold">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: line.color }} />
                  <span>{line.label} — Last 60 Minutes</span>
                </div>
                {line.unit && <span className="text-xs font-normal text-muted-foreground">{line.unit}</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.18)" vertical={false} />
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: "currentColor", opacity: 0.55 }} tickLine={false} axisLine={false} interval={4} />
                    <YAxis tick={{ fontSize: 10, fill: "currentColor", opacity: 0.55 }} tickLine={false} axisLine={false} width={36} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine
                      y={line.refLine}
                      stroke="#f97316"
                      strokeDasharray="4 4"
                      strokeOpacity={0.6}
                      label={{ value: "Threshold", position: "insideTopRight", fill: "#f97316", fontSize: 10 }}
                    />
                    <Line
                      type="monotone"
                      dataKey={line.key}
                      stroke={line.color}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                      name={line.label}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Environmental conditions */}
      <Card className="border shadow-sm bg-muted/40">
        <CardContent className="p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Current Readings</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {current
              ? [
                  { label: "PM2.5",       value: `${current.pm25.toFixed(1)} µg/m³`,    sub: current.pm25 > 35 ? "Above threshold" : "Within safe range" },
                  { label: "VOC / CO₂",   value: `${current.voc} ppm`,                  sub: current.voc > 1000 ? "Elevated" : "Normal" },
                  { label: "Temperature", value: `${current.temperature.toFixed(1)}°C`,  sub: "Indoor" },
                  { label: "Humidity",    value: `${current.humidity}%`,                 sub: current.humidity > 65 ? "High" : current.humidity < 30 ? "Low" : "Optimal" },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">{item.value}</p>
                    <p className="text-[10px] text-muted-foreground">{item.sub}</p>
                  </div>
                ))
              : <p className="text-sm text-muted-foreground col-span-4 text-center py-2">Loading sensor data…</p>
            }
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
