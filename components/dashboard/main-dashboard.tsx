"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  PolarAngleAxis,
} from "recharts"
import {
  ArrowUp,
  ArrowDown,
  Minus,
  Wind,
  Thermometer,
  Droplets,
  FlaskConical,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  RefreshCw,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { sensors, alerts as alertsApi, type SensorReading, type Alert } from "@/lib/api"

function getAqiCategory(aqi: number) {
  if (aqi <= 50) return { label: "Good", color: "#34d399" }
  if (aqi <= 100) return { label: "Moderate", color: "#f59e0b" }
  if (aqi <= 150) return { label: "Unhealthy for Sensitive", color: "#f97316" }
  if (aqi <= 200) return { label: "Unhealthy", color: "#ef4444" }
  return { label: "Hazardous", color: "#9b1c1c" }
}

function TrendIcon({ value }: { value: number }) {
  if (value > 0) return <ArrowUp className="h-3.5 w-3.5 text-orange-500" />
  if (value < 0) return <ArrowDown className="h-3.5 w-3.5 text-emerald-500" />
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />
}

function AlertItem({ alert }: { alert: Alert }) {
  const styles = {
    warning: {
      border: "border-l-orange-500",
      bg: "bg-orange-500/5",
      icon: <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />,
    },
    info: {
      border: "border-l-primary",
      bg: "bg-primary/5",
      icon: <TrendingUp className="h-4 w-4 text-primary shrink-0 mt-0.5" />,
    },
    success: {
      border: "border-l-emerald-500",
      bg: "bg-emerald-500/5",
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />,
    },
  }
  const s = styles[alert.level]
  const elapsed = (() => {
    const ms = Date.now() - new Date(alert.created_at).getTime()
    const m = Math.floor(ms / 60000)
    if (m < 60) return `${m} min ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h} hr ago`
    return `${Math.floor(h / 24)} d ago`
  })()

  return (
    <div className={`flex gap-3 border-l-2 pl-3 py-2.5 rounded-r-lg ${s.border} ${s.bg}`}>
      {s.icon}
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug text-foreground">{alert.message}</p>
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {elapsed}
        </p>
      </div>
    </div>
  )
}

function SensorCard({
  label,
  value,
  unit,
  delta,
  Icon,
  threshold,
}: {
  label: string
  value: number
  unit: string
  delta: number
  Icon: React.ElementType
  threshold: number
}) {
  const pct = Math.min((value / threshold) * 100, 100)
  const barColor = pct > 80 ? "#f97316" : pct > 60 ? "#f59e0b" : "#34d399"
  return (
    <Card className="border shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div className="flex items-center gap-1 text-xs font-medium">
            <TrendIcon value={delta} />
            <span className={delta > 0 ? "text-orange-500" : delta < 0 ? "text-emerald-500" : "text-muted-foreground"}>
              {delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)}
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-2xl font-bold tabular-nums text-foreground">{value.toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">{unit}</span>
        </div>
        <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: barColor }} />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">{Math.round(pct)}% of threshold</p>
      </CardContent>
    </Card>
  )
}

export function MainDashboard() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [reading, setReading] = useState<SensorReading | null>(null)
  const [alertList, setAlertList] = useState<Alert[]>([])
  const [prevReading, setPrevReading] = useState<SensorReading | null>(null)
  const [loadingErr, setLoadingErr] = useState("")

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [cur, als] = await Promise.all([sensors.current(), alertsApi.list(6)])
        if (cancelled) return
        setPrevReading((p) => p ?? cur)
        setReading((prev) => { setPrevReading(prev); return cur })
        setAlertList(als)
      } catch (e) {
        if (!cancelled) setLoadingErr(e instanceof Error ? e.message : "Failed to load data")
      }
    }
    load()
    const id = setInterval(load, 30_000)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  const isDark = mounted && resolvedTheme === "dark"
  const aqiValue = reading?.aqi ?? 0
  const aqiCategory = getAqiCategory(aqiValue)
  const gaugeData = [{ value: (aqiValue / 300) * 100, fill: aqiCategory.color }]
  const triggerThreshold = 75
  const exceeded = aqiValue > triggerThreshold

  const statColors = {
    risk: exceeded ? "#f97316" : isDark ? "#34d399" : "#059669",
    forecast: isDark ? "#34d399" : "#059669",
    peak: "#f59e0b",
    updated: isDark ? "#86efac" : "#059669",
  }

  const sensorDefs = reading && prevReading
    ? [
        { label: "PM2.5",       value: reading.pm25,        unit: "µg/m³", delta: reading.pm25 - prevReading.pm25,        Icon: Wind,         threshold: 35 },
        { label: "VOC / CO₂",   value: reading.voc,         unit: "ppm",   delta: reading.voc - prevReading.voc,          Icon: FlaskConical, threshold: 1000 },
        { label: "Temperature", value: reading.temperature, unit: "°C",    delta: reading.temperature - prevReading.temperature, Icon: Thermometer,  threshold: 30 },
        { label: "Humidity",    value: reading.humidity,    unit: "%",     delta: reading.humidity - prevReading.humidity, Icon: Droplets,     threshold: 80 },
      ]
    : []

  if (loadingErr) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm gap-2">
        <RefreshCw className="h-4 w-4" />
        {loadingErr}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
      {/* Left column */}
      <div className="flex flex-col gap-6">
        {/* AQI Hero Card */}
        <Card className="relative overflow-hidden border border-border dark:border-0 bg-linear-to-br from-white via-emerald-50/40 to-teal-50/60 dark:from-emerald-950 dark:via-slate-900 dark:to-teal-950 shadow-md dark:shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.07),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top_right,rgba(52,211,153,0.18),transparent_60%)]" />
          <CardContent className="relative p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Gauge */}
              <div className="relative shrink-0">
                <div className="h-52 w-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      cx="50%" cy="50%"
                      innerRadius="72%" outerRadius="100%"
                      startAngle={225} endAngle={-45}
                      data={gaugeData} barSize={14}
                    >
                      <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                      <RadialBar
                        background={{ fill: isDark ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.07)" }}
                        dataKey="value" cornerRadius={8} angleAxisId={0}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-bold tabular-nums leading-none" style={{ color: aqiCategory.color }}>
                    {reading ? aqiValue : "—"}
                  </span>
                  <span className="text-xs text-muted-foreground dark:text-white/50 mt-1 uppercase tracking-widest font-medium">AQI</span>
                </div>
              </div>

              {/* AQI Details */}
              <div className="flex flex-col gap-4 flex-1">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="h-2.5 w-2.5 rounded-full animate-pulse" style={{ backgroundColor: aqiCategory.color }} />
                    <span className="text-sm font-medium text-muted-foreground dark:text-white/60 uppercase tracking-wider">
                      Air Quality Index
                    </span>
                  </div>
                  {reading
                    ? <h2 className="text-3xl font-bold" style={{ color: aqiCategory.color }}>{aqiCategory.label}</h2>
                    : <Skeleton className="h-9 w-32 mt-1" />
                  }
                  <p className="text-sm text-muted-foreground dark:text-white/60 mt-1">
                    {exceeded
                      ? "Conditions elevated. Limit prolonged exertion outdoors."
                      : "Air quality within acceptable range. Stay aware."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Personal Risk",  value: exceeded ? "Elevated" : "Normal",    color: statColors.risk },
                    { label: "Forecast",        value: "Improving",                         color: statColors.forecast },
                    { label: "Peak Today",      value: reading ? `AQI ${aqiValue}` : null,  color: statColors.peak },
                    { label: "Last Updated",    value: reading ? "Just now" : null,          color: statColors.updated },
                  ].map((item) => (
                    <div key={item.label} className="bg-black/4 dark:bg-white/5 rounded-xl p-3">
                      <p className="text-xs text-muted-foreground dark:text-white/50 uppercase tracking-wider">{item.label}</p>
                      {item.value !== null
                        ? <p className="text-sm font-semibold mt-0.5" style={{ color: item.color }}>{item.value}</p>
                        : <Skeleton className="h-4 w-16 mt-1" />
                      }
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sensor Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {sensorDefs.length > 0
            ? sensorDefs.map((s) => <SensorCard key={s.label} {...s} />)
            : Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="border shadow-sm">
                  <CardContent className="p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-9 w-9 rounded-xl" />
                      <Skeleton className="h-4 w-10" />
                    </div>
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-7 w-24" />
                    <Skeleton className="h-1.5 w-full rounded-full" />
                    <Skeleton className="h-3 w-28" />
                  </CardContent>
                </Card>
              ))
          }
        </div>

        {/* Trigger Threshold Status */}
        <Card className={`border-2 ${exceeded ? "border-orange-500/40 bg-orange-500/5" : "border-emerald-500/40 bg-emerald-500/5"}`}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${exceeded ? "bg-orange-500/15" : "bg-emerald-500/15"}`}>
                  {exceeded
                    ? <AlertTriangle className="h-5 w-5 text-orange-500" />
                    : <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Personalized Trigger Threshold</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Set at AQI {triggerThreshold} · Current: {reading?.aqi ?? "—"}
                    {exceeded ? " — Threshold exceeded" : " — Within safe range"}
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={`font-semibold px-3 py-1 text-sm ${
                  exceeded
                    ? "bg-orange-500/20 text-orange-600 border-orange-500/30 dark:text-orange-400"
                    : "bg-emerald-500/20 text-emerald-700 border-emerald-500/30 dark:text-emerald-400"
                }`}
              >
                {exceeded ? "Action Recommended" : "Safe"}
              </Badge>
            </div>

            {exceeded && (
              <div className="mt-4 pt-4 border-t border-orange-500/20">
                <p className="text-xs text-muted-foreground font-medium mb-2">Recommended actions:</p>
                <div className="flex flex-wrap gap-2">
                  {["Stay indoors", "Use air purifier", "Take preventive inhaler", "Avoid physical exertion"].map((action) => (
                    <span key={action} className="text-xs bg-background border border-border rounded-full px-3 py-1 text-foreground">
                      {action}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right column — Alerts + quick stats */}
      <div className="flex flex-col gap-4">
        <Card className="border shadow-sm flex-1">
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="flex items-center justify-between text-base font-semibold">
              <span>Recent Alerts</span>
              <Badge variant="outline" className="text-xs font-medium bg-orange-500/10 text-orange-600 border-orange-500/30 dark:text-orange-400">
                {alertList.filter((a) => !a.read).length} Active
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 flex flex-col gap-3">
            {!reading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-3 border-l-2 border-muted pl-3 py-2.5 rounded-r-lg bg-muted/30">
                    <Skeleton className="h-4 w-4 rounded-full shrink-0 mt-0.5" />
                    <div className="flex-1 flex flex-col gap-2">
                      <Skeleton className="h-3.5 w-full" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))
              : alertList.length === 0
                ? <p className="text-sm text-muted-foreground text-center py-4">No alerts yet</p>
                : alertList.map((a) => <AlertItem key={a.id} alert={a} />)
            }
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Sensor Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4 flex flex-col gap-3">
            {reading
              ? [
                  { label: "PM2.5",       value: `${reading.pm25.toFixed(1)} µg/m³` },
                  { label: "VOC / CO₂",   value: `${reading.voc} ppm` },
                  { label: "Temperature", value: `${reading.temperature.toFixed(1)}°C` },
                  { label: "Humidity",    value: `${reading.humidity}%` },
                  { label: "AQI",         value: `${reading.aqi}` },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{stat.label}</span>
                    <span className="font-semibold tabular-nums text-foreground">{stat.value}</span>
                  </div>
                ))
              : Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))
            }
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
