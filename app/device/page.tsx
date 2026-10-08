"use client"

import { useEffect, useState } from "react"
import { Wind, FlaskConical, Thermometer, Droplets, Satellite, KeyRound } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { deviceView, ApiError, type SensorReading } from "@/lib/api"

const STORAGE_KEY = "aeroguard_device_viewer_key"

function getAqiCategory(aqi: number) {
  if (aqi <= 50) return { label: "Good", color: "#34d399" }
  if (aqi <= 100) return { label: "Moderate", color: "#f59e0b" }
  if (aqi <= 150) return { label: "Unhealthy for Sensitive", color: "#f97316" }
  if (aqi <= 200) return { label: "Unhealthy", color: "#ef4444" }
  return { label: "Hazardous", color: "#9b1c1c" }
}

function StatTile({ label, value, unit, Icon }: { label: string; value: number; unit: string; Icon: React.ElementType }) {
  return (
    <Card className="border shadow-sm">
      <CardContent className="p-4">
        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-2xl font-bold tabular-nums text-foreground">{value.toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">{unit}</span>
        </div>
      </CardContent>
    </Card>
  )
}

export default function DeviceViewerPage() {
  const [keyInput, setKeyInput] = useState("")
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [reading, setReading] = useState<SensorReading | null>(null)
  const [error, setError] = useState("")
  const [checkedOnce, setCheckedOnce] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      setKeyInput(saved)
      setActiveKey(saved)
    }
  }, [])

  useEffect(() => {
    if (!activeKey) return
    let cancelled = false
    async function load() {
      try {
        const cur = await deviceView.current(activeKey!)
        if (!cancelled) {
          setReading(cur)
          setError("")
        }
      } catch (e) {
        if (cancelled) return
        if (e instanceof ApiError && e.status === 404) {
          // No reading yet — not an error, just nothing to show.
          setReading(null)
          setError("")
        } else {
          setError(e instanceof ApiError && e.status === 401
            ? "Invalid device key"
            : e instanceof Error ? e.message : "Failed to load")
        }
      } finally {
        if (!cancelled) setCheckedOnce(true)
      }
    }
    load()
    const id = setInterval(load, 30_000)
    return () => { cancelled = true; clearInterval(id) }
  }, [activeKey])

  function connect() {
    const trimmed = keyInput.trim()
    if (!trimmed) return
    localStorage.setItem(STORAGE_KEY, trimmed)
    setCheckedOnce(false)
    setReading(null)
    setError("")
    setActiveKey(trimmed)
  }

  function disconnect() {
    localStorage.removeItem(STORAGE_KEY)
    setActiveKey(null)
    setReading(null)
    setError("")
    setCheckedOnce(false)
  }

  const isLoading = !!activeKey && !checkedOnce
  const hasData = !!reading
  const aqiValue = reading?.aqi ?? 0
  const aqiCategory = hasData ? getAqiCategory(aqiValue) : { label: "No data", color: "#9ca3af" }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-2xl flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground">AeroGuard Device Viewer</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View a device's live readings with just its key — no account needed.
          </p>
        </div>

        {!activeKey ? (
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Enter a device key</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Label htmlFor="device-key">Device key</Label>
              <Input
                id="device-key"
                placeholder="agd_..."
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && connect()}
                className="font-mono text-sm"
              />
              <Button onClick={connect} disabled={!keyInput.trim()}>View readings</Button>
            </CardContent>
          </Card>
        ) : error === "Invalid device key" ? (
          <Card className="border shadow-sm">
            <CardContent className="p-6 flex flex-col items-center gap-3 text-center">
              <KeyRound className="h-8 w-8 text-destructive" />
              <p className="text-sm font-semibold text-foreground">Invalid device key</p>
              <p className="text-xs text-muted-foreground">Double-check the key and try again.</p>
              <Button variant="outline" size="sm" onClick={disconnect}>Try a different key</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="relative overflow-hidden border border-border bg-linear-to-br from-white via-emerald-50/40 to-teal-50/60 dark:from-emerald-950 dark:via-slate-900 dark:to-teal-950 shadow-md">
              <CardContent className="p-6 flex flex-col items-center gap-2">
                <span className="text-5xl font-bold tabular-nums" style={{ color: aqiCategory.color }}>
                  {isLoading ? "—" : aqiValue}
                </span>
                <span className="text-xs text-muted-foreground uppercase tracking-widest font-medium">AQI</span>
                {!isLoading && (
                  <span className="text-sm font-semibold mt-1" style={{ color: aqiCategory.color }}>
                    {aqiCategory.label}
                  </span>
                )}
                {!isLoading && !hasData && !error && (
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                    <Satellite className="h-3.5 w-3.5" /> No readings yet — waiting for the device.
                  </p>
                )}
                {error && error !== "Invalid device key" && (
                  <p className="text-xs text-destructive mt-2">{error}</p>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <StatTile label="PM2.5" value={reading?.pm25 ?? 0} unit="µg/m³" Icon={Wind} />
              <StatTile label="VOC / CO₂" value={reading?.voc ?? 0} unit="ppm" Icon={FlaskConical} />
              <StatTile label="Temperature" value={reading?.temperature ?? 0} unit="°C" Icon={Thermometer} />
              <StatTile label="Humidity" value={reading?.humidity ?? 0} unit="%" Icon={Droplets} />
            </div>

            <div className="flex justify-center">
              <Button variant="ghost" size="sm" onClick={disconnect} className="text-muted-foreground">
                Use a different device key
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
