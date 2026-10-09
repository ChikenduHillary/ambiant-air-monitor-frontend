"use client"

import { useEffect, useState } from "react"
import { Volume2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { isSoundEnabled, setSoundEnabled } from "@/lib/sound-pref"

export function PreferencesCard() {
  const [soundOn, setSoundOn] = useState(true)

  useEffect(() => {
    setSoundOn(isSoundEnabled())
  }, [])

  function toggle(checked: boolean) {
    setSoundOn(checked)
    setSoundEnabled(checked)
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-primary" />
          Preferences
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Alert sound</p>
            <p className="text-xs text-muted-foreground mt-0.5">Play a sound when a new threshold-breach alert comes in.</p>
          </div>
          <Switch checked={soundOn} onCheckedChange={toggle} />
        </div>
      </CardContent>
    </Card>
  )
}
