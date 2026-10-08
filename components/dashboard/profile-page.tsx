"use client"

import { useState } from "react"
import { Crown, LogOut } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/context/auth"
import { getAqiCategory } from "@/lib/aqi"

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  )
}

export function ProfilePage() {
  const { user, logout } = useAuth()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const threshold = user?.threshold ?? 75
  const category = getAqiCategory(threshold)

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Avatar / identity */}
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="h-20 w-20 rounded-full bg-primary/15 border-2 border-primary flex items-center justify-center overflow-hidden">
          {user?.avatar_url
            ? <img src={user.avatar_url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
            : <span className="text-3xl font-bold text-primary">{user?.name?.charAt(0)?.toUpperCase() ?? "U"}</span>
          }
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-foreground">{user?.name ?? "—"}</p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
        {user?.role === "admin" && (
          <span className="flex items-center gap-1.5 rounded-full px-3.5 py-1 bg-purple-500/15 border border-purple-500/30 text-xs font-bold text-purple-600 dark:text-purple-300">
            <Crown className="h-3 w-3" /> Admin
          </span>
        )}
      </div>

      {/* Patient info */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-1">
          <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Patient Profile</CardTitle>
        </CardHeader>
        <CardContent className="pt-1">
          <Row label="Patient ID" value={user?.patient_id ?? "—"} />
          <Row label="Condition" value={user?.condition ?? "—"} />
          <Row label="Role" value={user?.role === "admin" ? "Administrator" : "Patient"} />
        </CardContent>
      </Card>

      {/* Alert threshold */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-1">
          <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Alert Threshold</CardTitle>
        </CardHeader>
        <CardContent className="pt-1 flex items-center gap-4">
          <div
            className="h-16 w-16 rounded-full border-[3px] flex flex-col items-center justify-center shrink-0"
            style={{ borderColor: category.color }}
          >
            <span className="text-lg font-extrabold tabular-nums" style={{ color: category.color }}>{threshold}</span>
            <span className="text-[9px] text-muted-foreground -mt-1">AQI</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You'll be alerted when AQI exceeds {threshold}. Current category:{" "}
            <span className="font-bold" style={{ color: category.color }}>{category.label}</span>.
          </p>
        </CardContent>
      </Card>

      {/* About */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-1">
          <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">About AeroGuard</CardTitle>
        </CardHeader>
        <CardContent className="pt-1">
          <Row label="Version" value="1.0.0" />
          <Row label="Backend" value="Go REST API" />
          <Row label="Purpose" value="Respiratory Health Monitoring" />
        </CardContent>
      </Card>

      <Button variant="outline" className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setConfirmOpen(true)}>
        <LogOut className="h-4 w-4" /> Sign Out
      </Button>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out?</AlertDialogTitle>
            <AlertDialogDescription>You'll need to sign back in to see your readings again.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={logout} className="bg-destructive text-white hover:bg-destructive/90">
              Sign out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
