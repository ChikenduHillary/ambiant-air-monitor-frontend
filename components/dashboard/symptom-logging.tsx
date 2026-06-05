"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Clock, Wind, Heart, Activity, AlertCircle, Zap, Frown, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { symptoms as symptomsApi, type SymptomLog } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"

const SYMPTOMS = [
  { id: "Wheeze",               label: "Wheeze",              icon: Wind },
  { id: "Cough",                label: "Cough",               icon: Activity },
  { id: "Shortness of Breath",  label: "Shortness of Breath", icon: Heart },
  { id: "Chest Tightness",      label: "Chest Tightness",     icon: AlertCircle },
  { id: "Fatigue",              label: "Fatigue",             icon: Zap },
  { id: "Anxiety / Panic",      label: "Anxiety / Panic",     icon: Frown },
  { id: "Runny Nose",           label: "Runny Nose",          icon: Wind },
  { id: "Itchy Eyes",           label: "Itchy Eyes",          icon: AlertCircle },
]

const TRIGGERS = [
  "Dust", "Pollen", "Smoke", "Pet Dander",
  "Cold Air", "Exercise", "Mold", "Perfume / Chemicals",
]

const SEVERITY_LABELS = ["", "Mild", "Moderate", "Severe"]
const SEVERITY_COLORS = ["", "text-emerald-500", "text-amber-500", "text-orange-500"]
const SEVERITY_BG    = ["", "bg-emerald-500/15 border-emerald-500/30", "bg-amber-500/15 border-amber-500/30", "bg-orange-500/15 border-orange-500/30"]

function elapsed(iso: string) {
  const ms = Date.now() - new Date(iso).getTime()
  const m = Math.floor(ms / 60000)
  if (m < 60) return `${m} min ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} hr ago`
  return `${Math.floor(h / 24)} days ago`
}

export function SymptomLogging() {
  const [selected, setSelected]         = useState<string[]>([])
  const [selTriggers, setSelTriggers]   = useState<string[]>([])
  const [severity, setSeverity]         = useState([2])
  const [notes, setNotes]               = useState("")
  const [submitting, setSubmitting]     = useState(false)
  const [submitted, setSubmitted]       = useState(false)
  const [error, setError]               = useState("")
  const [logs, setLogs]                 = useState<SymptomLog[]>([])
  const [logsLoading, setLogsLoading]   = useState(true)

  useEffect(() => {
    symptomsApi.list()
      .then(setLogs)
      .catch(() => {})
      .finally(() => setLogsLoading(false))
  }, [])

  function toggle(id: string) {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }
  function toggleTrigger(t: string) {
    setSelTriggers((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t])
  }

  async function handleSubmit() {
    if (selected.length === 0) { setError("Select at least one symptom"); return }
    setError("")
    setSubmitting(true)
    try {
      const log = await symptomsApi.create({
        symptoms: selected,
        severity: severity[0],
        triggers: selTriggers,
        notes,
      })
      setLogs((prev) => [log, ...prev])
      setSubmitted(true)
      setTimeout(() => {
        setSubmitted(false)
        setSelected([])
        setSelTriggers([])
        setSeverity([2])
        setNotes("")
      }, 2500)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
      {/* Log form */}
      <div className="flex flex-col gap-5">
        <Card className="border shadow-sm">
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="text-base font-semibold">Log Symptoms</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">Select all symptoms you're experiencing right now</p>
          </CardHeader>
          <CardContent className="px-5 pb-5 flex flex-col gap-5">
            {/* Symptom toggles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SYMPTOMS.map(({ id, label, icon: Icon }) => {
                const active = selected.includes(id)
                return (
                  <button
                    key={id}
                    onClick={() => toggle(id)}
                    className={`flex flex-col items-center gap-2 rounded-xl border px-3 py-3 text-xs font-medium transition-all ${
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                )
              })}
            </div>

            {/* Severity */}
            <div className="flex flex-col gap-3">
              <Label className="text-sm font-semibold">
                Severity{" "}
                <Badge
                  variant="outline"
                  className={`ml-2 text-xs font-semibold ${SEVERITY_BG[severity[0]]} ${SEVERITY_COLORS[severity[0]]}`}
                >
                  {SEVERITY_LABELS[severity[0]]}
                </Badge>
              </Label>
              <Slider
                min={1} max={3} step={1}
                value={severity}
                onValueChange={setSeverity}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Mild</span><span>Moderate</span><span>Severe</span>
              </div>
            </div>

            {/* Triggers */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-semibold">Triggers (optional)</Label>
              <div className="flex flex-wrap gap-2">
                {TRIGGERS.map((t) => {
                  const active = selTriggers.includes(t)
                  return (
                    <button
                      key={t}
                      onClick={() => toggleTrigger(t)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      {t}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-semibold">Notes (optional)</Label>
              <Textarea
                placeholder="Any additional context — e.g. 'after morning run', 'woke up at 3am'"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="resize-none text-sm rounded-xl"
                rows={3}
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-500/8 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>
            )}

            {submitted ? (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-sm font-semibold text-emerald-600">
                <CheckCircle2 className="h-4 w-4" /> Symptom log saved successfully
              </div>
            ) : (
              <Button onClick={handleSubmit} disabled={submitting || selected.length === 0} className="h-10 rounded-xl font-semibold">
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Symptom Log
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent logs */}
      <div className="flex flex-col gap-4">
        <Card className="border shadow-sm">
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="text-sm font-semibold">Recent Logs</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 flex flex-col gap-3">
            {logsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2 p-3 rounded-xl bg-muted/50 border border-border">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-16 rounded-full" />
                  </div>
                  <div className="flex gap-1">
                    <Skeleton className="h-5 w-14 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                </div>
              ))
            ) : logs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No logs yet — use the form to add your first entry.</p>
            ) : (
              logs.slice(0, 8).map((log) => (
                <div key={log.id} className="flex flex-col gap-2 p-3 rounded-xl bg-muted/50 border border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {elapsed(log.created_at)}
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-semibold ${SEVERITY_BG[log.severity]} ${SEVERITY_COLORS[log.severity]}`}
                    >
                      {SEVERITY_LABELS[log.severity]}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {log.symptoms.map((s) => (
                      <span key={s} className="text-[10px] bg-background border border-border rounded-full px-2 py-0.5 text-foreground">
                        {s}
                      </span>
                    ))}
                  </div>
                  {log.triggers.length > 0 && (
                    <p className="text-[10px] text-muted-foreground">
                      Triggers: {log.triggers.join(", ")}
                    </p>
                  )}
                  {log.notes && (
                    <p className="text-xs text-muted-foreground italic">{log.notes}</p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Weekly summary */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            {(() => {
              const cutoff = Date.now() - 7 * 24 * 3600 * 1000
              const weekLogs = logs.filter((l) => new Date(l.created_at).getTime() > cutoff)
              const topSymptoms: Record<string, number> = {}
              weekLogs.forEach((l) => l.symptoms.forEach((s) => { topSymptoms[s] = (topSymptoms[s] ?? 0) + 1 }))
              const sorted = Object.entries(topSymptoms).sort((a, b) => b[1] - a[1]).slice(0, 3)
              return (
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total events</span>
                    <span className="font-semibold text-foreground">{weekLogs.length}</span>
                  </div>
                  {sorted.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Most frequent</span>
                      <span className="font-semibold text-foreground">{sorted[0]?.[0] ?? "—"}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg severity</span>
                    <span className="font-semibold text-foreground">
                      {weekLogs.length
                        ? SEVERITY_LABELS[Math.round(weekLogs.reduce((s, l) => s + l.severity, 0) / weekLogs.length)]
                        : "—"}
                    </span>
                  </div>
                </div>
              )
            })()}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
