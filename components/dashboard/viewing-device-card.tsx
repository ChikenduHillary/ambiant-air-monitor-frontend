"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Radio, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { deviceView, ApiError } from "@/lib/api"
import { getViewingDeviceKey, setViewingDeviceKey, clearViewingDeviceKey } from "@/lib/viewing-device"

export function ViewingDeviceCard() {
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [input, setInput] = useState("")
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    const saved = getViewingDeviceKey()
    setActiveKey(saved)
    setInput(saved ?? "")
  }, [])

  async function save() {
    const trimmed = input.trim()
    if (!trimmed) return
    setVerifying(true)
    try {
      await deviceView.current(trimmed)
      setViewingDeviceKey(trimmed)
      setActiveKey(trimmed)
      toast.success("Dashboard is now showing this device's readings")
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        toast.error("Invalid device key")
      } else {
        // A 404 ("no readings yet") still means the key itself is valid.
        setViewingDeviceKey(trimmed)
        setActiveKey(trimmed)
        toast.success("Dashboard is now showing this device's readings")
      }
    } finally {
      setVerifying(false)
    }
  }

  function stop() {
    clearViewingDeviceKey()
    setActiveKey(null)
    setInput("")
    toast.success("Back to your own devices")
  }

  return (
    <Card className="border shadow-sm transition-all animate-in fade-in slide-in-from-top-2 duration-300">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Radio className="h-4 w-4 text-primary" />
          View a Device
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          Paste any device's key to make your dashboard show its readings instead of your own —
          handy when a team is testing against one shared unit.
        </p>

        {activeKey ? (
          <div className="flex items-center gap-3 border rounded-xl p-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Radio className="h-4 w-4 text-primary animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Viewing a shared device</p>
              <p className="text-xs text-muted-foreground font-mono truncate">{activeKey}</p>
            </div>
            <Button variant="outline" size="sm" onClick={stop}>Stop viewing</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Label htmlFor="viewing-device-key">Device key</Label>
            <div className="flex gap-2">
              <Input
                id="viewing-device-key"
                placeholder="agd_..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && save()}
                className="font-mono text-sm"
              />
              <Button onClick={save} disabled={!input.trim() || verifying} className="shrink-0">
                {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "View"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
