"use client"

import { useEffect, useState } from "react"
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import { Calendar, TrendingDown, TrendingUp, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { sensors, type DailyAggregate } from "@/lib/api"

function getHeatColor(aqi: number) {
  if (aqi <= 50) return "bg-emerald-500"
  if (aqi <= 75) return "bg-emerald-400"
  if (aqi <= 100) return "bg-amber-400"
  if (aqi <= 130) return "bg-orange-400"
  if (aqi <= 160) return "bg-orange-500"
  return "bg-red-500"
}

function getHeatOpacity(aqi: number) {
  const pct = Math.min(aqi / 200, 1)
  if (pct < 0.3) return "opacity-30"
  if (pct < 0.5) return "opacity-50"
  if (pct < 0.7) return "opacity-70"
  return "opacity-100"
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ color: string; name: string; value: number; dataKey: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2.5 shadow-xl text-xs min-w-36">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-3 mb-1">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-muted-foreground">{p.name}</span>
          </div>
          <span className="font-semibold tabular-nums text-foreground">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

// Short date label: "Jun 2" from "2026-06-02"
function shortDate(d: string) {
  const [, m, day] = d.split("-")
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
  return `${months[parseInt(m) - 1]} ${parseInt(day)}`
}

const ranges = [
  { label: "7 Days", days: 7 },
  { label: "30 Days", days: 30 },
  { label: "3 Months", days: 90 },
]

export function HistoryTrends() {
  const [rangeIdx, setRangeIdx] = useState(1)
  const [data, setData] = useState<DailyAggregate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError("")
    sensors.daily(ranges[rangeIdx].days)
      .then((d) => { if (!cancelled) { setData(d); setLoading(false) } })
      .catch((e) => { if (!cancelled) { setError(e.message); setLoading(false) } })
    return () => { cancelled = true }
  }, [rangeIdx])

  const chartData = data.map((d) => ({ ...d, date: shortDate(d.date) }))
  const calendarDays = data.slice(-42)

  const avgPm25 = data.length ? +(data.reduce((s, d) => s + d.pm25, 0) / data.length).toFixed(1) : 0
  const avgAqi = data.length ? Math.round(data.reduce((s, d) => s + d.aqi, 0) / data.length) : 0
  const totalSymptoms = data.reduce((s, d) => s + d.symptoms, 0)
  const goodDays = data.filter((d) => d.aqi <= 75).length

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm gap-2">
        <RefreshCw className="h-4 w-4" /> {error}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Health & Air Quality Trends</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Compare air quality with symptom events over time</p>
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
          {ranges.map((r, i) => (
            <button
              key={r.label}
              onClick={() => setRangeIdx(i)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                rangeIdx === i ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Avg AQI",         value: loading ? "…" : avgAqi,                         sub: avgAqi < 75 ? "Good range" : "Moderate",      icon: avgAqi < 75 ? TrendingDown : TrendingUp, iconColor: avgAqi < 75 ? "text-emerald-500" : "text-amber-500" },
          { label: "Avg PM2.5",       value: loading ? "…" : `${avgPm25} µg/m³`,              sub: avgPm25 < 20 ? "Below target" : "Slightly elevated", icon: avgPm25 < 20 ? TrendingDown : TrendingUp, iconColor: avgPm25 < 20 ? "text-emerald-500" : "text-orange-500" },
          { label: "Good Air Days",   value: loading ? "…" : `${goodDays} / ${data.length}`,  sub: data.length ? `${Math.round((goodDays / data.length) * 100)}% of period` : "—", icon: Calendar, iconColor: "text-primary" },
          { label: "Symptom Events",  value: loading ? "…" : totalSymptoms,                   sub: data.length ? `${(totalSymptoms / data.length * 7).toFixed(1)} per week` : "—", icon: TrendingDown, iconColor: totalSymptoms < 5 ? "text-emerald-500" : "text-orange-500" },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                  <Icon className={`h-4 w-4 ${stat.iconColor}`} />
                </div>
                <p className="text-2xl font-bold text-foreground tabular-nums">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Trend chart */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-2 pt-5 px-5">
          <CardTitle className="text-sm font-semibold">PM2.5, AQI & Symptom Events</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-4">
          <div className="h-64">
            {loading
              ? <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Loading chart…</div>
              : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.18)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "currentColor", opacity: 0.55 }} tickLine={false} axisLine={false} interval={Math.max(0, Math.floor(chartData.length / 7))} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "currentColor", opacity: 0.55 }} tickLine={false} axisLine={false} width={36} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "currentColor", opacity: 0.55 }} tickLine={false} axisLine={false} width={28} domain={[0, 5]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} iconType="circle" iconSize={8} />
                    <ReferenceLine yAxisId="left" y={75} stroke="#f97316" strokeDasharray="4 4" strokeOpacity={0.5} />
                    <Line yAxisId="left" type="monotone" dataKey="aqi" stroke="#a855f7" strokeWidth={2} dot={false} name="AQI" activeDot={{ r: 4, strokeWidth: 0 }} />
                    <Line yAxisId="left" type="monotone" dataKey="pm25" stroke="#f97316" strokeWidth={2} dot={false} name="PM2.5" activeDot={{ r: 4, strokeWidth: 0 }} />
                    <Bar yAxisId="right" dataKey="symptoms" fill="oklch(0.55 0.16 196)" fillOpacity={0.7} name="Symptom Events" radius={[3, 3, 0, 0]} maxBarSize={16} />
                  </ComposedChart>
                </ResponsiveContainer>
              )
            }
          </div>
        </CardContent>
      </Card>

      {/* Calendar heatmap */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-2 pt-5 px-5">
          <CardTitle className="text-sm font-semibold">AQI Calendar Heatmap — Last 42 Days</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {loading
            ? <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Loading…</div>
            : (
              <>
                <div className="grid grid-cols-7 gap-1.5">
                  {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
                    <div key={d} className="text-center text-[10px] font-medium text-muted-foreground pb-1">{d}</div>
                  ))}
                  {calendarDays.map((day, i) => (
                    <div
                      key={i}
                      title={`${day.date} — AQI ${day.aqi}${day.symptoms ? ` · ${day.symptoms} symptom event(s)` : ""}`}
                      className={`relative h-10 rounded-lg ${getHeatColor(day.aqi)} ${getHeatOpacity(day.aqi)} flex flex-col items-center justify-center cursor-default hover:opacity-100 transition-opacity`}
                    >
                      <span className="text-[9px] text-white font-bold drop-shadow-sm">{day.aqi}</span>
                      {day.symptoms > 0 && (
                        <span className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-white/90 shadow-sm" />
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 mt-4 flex-wrap">
                  <span className="text-[10px] text-muted-foreground mr-1">AQI:</span>
                  {[
                    { color: "bg-emerald-500", label: "0–50" },
                    { color: "bg-amber-400",   label: "51–100" },
                    { color: "bg-orange-400",  label: "101–130" },
                    { color: "bg-red-500",     label: "130+" },
                  ].map((l) => (
                    <div key={l.label} className="flex items-center gap-1">
                      <span className={`h-3 w-3 rounded-sm ${l.color}`} />
                      <span className="text-[10px] text-muted-foreground">{l.label}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-1 ml-3">
                    <span className="h-2 w-2 rounded-full bg-foreground/60" />
                    <span className="text-[10px] text-muted-foreground">Symptom event</span>
                  </div>
                </div>
              </>
            )}
        </CardContent>
      </Card>

      {/* Daily summaries */}
      {!loading && data.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-foreground mb-3">Daily Summaries</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {data.slice(-4).reverse().map((day, i) => (
              <Card key={i} className="border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-muted-foreground">{shortDate(day.date)}</p>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${day.aqi <= 75 ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600" : "border-amber-500/30 bg-amber-500/10 text-amber-600"}`}
                    >
                      {day.aqi <= 75 ? "Good" : "Moderate"}
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">AQI</span>
                      <span className="font-semibold tabular-nums text-foreground">{day.aqi}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">PM2.5</span>
                      <span className="font-semibold tabular-nums text-foreground">{day.pm25} µg/m³</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Symptoms</span>
                      <span className={`font-semibold tabular-nums ${day.symptoms > 0 ? "text-orange-500" : "text-emerald-500"}`}>
                        {day.symptoms > 0 ? `${day.symptoms} event${day.symptoms > 1 ? "s" : ""}` : "None"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
