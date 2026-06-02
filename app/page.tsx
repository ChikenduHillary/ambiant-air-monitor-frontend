"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import {
  LayoutDashboard,
  Activity,
  BarChart2,
  Heart,
  Bell,
  Settings,
  ChevronRight,
  Wind,
  User,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MainDashboard } from "@/components/dashboard/main-dashboard"
import { LiveReadings } from "@/components/dashboard/live-readings"
import { SymptomLogging } from "@/components/dashboard/symptom-logging"
import { HistoryTrends } from "@/components/dashboard/history-trends"
import { AdminOverview } from "@/components/admin/admin-overview"
import { AdminUsers } from "@/components/admin/admin-users"
import { AdminAlerts } from "@/components/admin/admin-alerts"
import { AdminSensors } from "@/components/admin/admin-sensors"
import { useAuth } from "@/context/auth"

type Section = "dashboard" | "live" | "history" | "symptoms" | "alerts" | "settings"
             | "admin-overview" | "admin-users" | "admin-alerts" | "admin-sensors"

const navItems = [
  { id: "dashboard" as Section, label: "Dashboard",     icon: LayoutDashboard },
  { id: "live"      as Section, label: "Live Readings", icon: Activity },
  { id: "history"   as Section, label: "History",       icon: BarChart2 },
  { id: "symptoms"  as Section, label: "Symptoms",      icon: Heart },
  { id: "alerts"    as Section, label: "Alerts",        icon: Bell, badge: 2 },
  { id: "settings"  as Section, label: "Settings",      icon: Settings },
]

const adminNavItems = [
  { id: "admin-overview" as Section, label: "Overview",    icon: LayoutDashboard },
  { id: "admin-users"    as Section, label: "Users",       icon: User },
  { id: "admin-alerts"   as Section, label: "Alerts",      icon: Bell },
  { id: "admin-sensors"  as Section, label: "Sensor Data", icon: Activity },
]

const sectionTitles: Record<Section, { title: string; subtitle: string }> = {
  dashboard:      { title: "Dashboard",        subtitle: "Real-time overview of your air quality and health status" },
  live:           { title: "Live Readings",    subtitle: "Real-time sensor data and environmental conditions" },
  history:        { title: "History & Trends", subtitle: "Analyze air quality and symptom patterns over time" },
  symptoms:       { title: "Symptom Log",      subtitle: "Record and track your respiratory symptoms" },
  alerts:         { title: "Alerts",           subtitle: "Notifications and threshold breach events" },
  settings:       { title: "Settings",         subtitle: "Configure your device, thresholds, and preferences" },
  "admin-overview": { title: "Admin — Overview",     subtitle: "System-wide statistics and health" },
  "admin-users":    { title: "Admin — Users",        subtitle: "Manage all registered patients and roles" },
  "admin-alerts":   { title: "Admin — Alerts",       subtitle: "Broadcast and manage system alerts" },
  "admin-sensors":  { title: "Admin — Sensor Data",  subtitle: "View and export all sensor readings" },
}

function AlertsPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
      <Bell className="h-12 w-12 opacity-30" />
      <p className="text-sm">Alerts panel coming soon</p>
    </div>
  )
}

function SettingsPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
      <Settings className="h-12 w-12 opacity-30" />
      <p className="text-sm">Settings panel coming soon</p>
    </div>
  )
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return <div className="h-9 w-9" />

  const isDark = theme === "dark"
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
      aria-label="Toggle theme"
    >
      {isDark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
    </button>
  )
}

export default function Page() {
  const { user, logout } = useAuth()
  const [section, setSection] = useState<Section>("dashboard")
  const [mobileOpen, setMobileOpen] = useState(false)

  function navigate(id: Section) {
    setSection(id)
    setMobileOpen(false)
  }

  const { title, subtitle } = sectionTitles[section]

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar border-r border-sidebar-border transition-transform duration-200 xl:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-5 border-b border-sidebar-border shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sidebar-primary/20">
            <Wind className="h-5 w-5 text-sidebar-primary" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-sidebar-foreground">AeroGuard</span>
            <p className="text-[10px] text-sidebar-foreground/50 uppercase tracking-widest leading-none mt-0.5">Air Monitor</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-8 w-8 xl:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="mb-2 px-2">
            <p className="text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-widest mb-1">Monitor</p>
          </div>
          {navItems.slice(0, 4).map(({ id, label, icon: Icon, badge }) => {
            const active = section === id
            return (
              <button
                key={id}
                onClick={() => navigate(id)}
                className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium mb-0.5 transition-all ${
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">{label}</span>
                {badge ? (
                  <Badge className="h-4.5 min-w-4.5 px-1.5 text-[10px] font-bold bg-orange-500 text-white border-0 rounded-full">
                    {badge}
                  </Badge>
                ) : active ? (
                  <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                ) : null}
              </button>
            )
          })}

          <div className="mt-4 mb-2 px-2">
            <p className="text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-widest mb-1">Manage</p>
          </div>
          {navItems.slice(4).map(({ id, label, icon: Icon, badge }) => {
            const active = section === id
            return (
              <button
                key={id}
                onClick={() => navigate(id)}
                className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium mb-0.5 transition-all ${
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">{label}</span>
                {badge ? (
                  <Badge className="h-4.5 min-w-4.5 px-1.5 text-[10px] font-bold bg-orange-500 text-white border-0 rounded-full">
                    {badge}
                  </Badge>
                ) : active ? (
                  <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                ) : null}
              </button>
            )
          })}

          {/* Admin section — only visible to admin users */}
          {user?.role === "admin" && (
            <>
              <div className="mt-5 mb-2 px-2">
                <p className="text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-widest mb-1">Admin</p>
              </div>
              {adminNavItems.map(({ id, label, icon: Icon }) => {
                const active = section === id
                return (
                  <button
                    key={id}
                    onClick={() => navigate(id)}
                    className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium mb-0.5 transition-all ${
                      active
                        ? "bg-purple-500/20 text-purple-600 dark:text-purple-300"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 text-left">{label}</span>
                    {active && <ChevronRight className="h-3.5 w-3.5 opacity-60" />}
                  </button>
                )
              })}
            </>
          )}
        </nav>

        {/* User */}
        <div className="border-t border-sidebar-border px-4 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-sidebar-primary/20 flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-sidebar-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-sidebar-foreground truncate">{user?.name ?? "—"}</p>
              <p className="text-[10px] text-sidebar-foreground/50">{user?.condition} · Patient ID {user?.patient_id}</p>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="shrink-0 h-7 w-7 flex items-center justify-center rounded-lg text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 xl:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col xl:ml-64">
        {/* Top navbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/95 backdrop-blur-sm px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 xl:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-base font-semibold text-foreground leading-tight">{title}</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">{subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2">
            {/* AQI chip */}
            <div className="hidden sm:flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">AQI 87 · Moderate</span>
            </div>

            {/* Theme toggle */}
            <ThemeToggle />

            {/* Notification bell */}
            <button className="relative h-9 w-9 flex items-center justify-center rounded-xl hover:bg-muted transition-colors">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-orange-500 border border-background" />
            </button>

            {/* Avatar */}
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center cursor-pointer hover:bg-primary/30 transition-colors">
              <User className="h-4 w-4 text-primary-foreground dark:text-primary" />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 sm:px-6 py-6 overflow-y-auto">
          {section === "dashboard"     && <MainDashboard />}
          {section === "live"          && <LiveReadings />}
          {section === "history"       && <HistoryTrends />}
          {section === "symptoms"      && <SymptomLogging />}
          {section === "alerts"        && <AlertsPlaceholder />}
          {section === "settings"      && <SettingsPlaceholder />}
          {section === "admin-overview" && <AdminOverview />}
          {section === "admin-users"    && <AdminUsers />}
          {section === "admin-alerts"   && <AdminAlerts />}
          {section === "admin-sensors"  && <AdminSensors />}
        </main>
      </div>
    </div>
  )
}
