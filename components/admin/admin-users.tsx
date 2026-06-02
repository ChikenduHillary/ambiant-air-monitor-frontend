"use client"

import { useEffect, useState } from "react"
import { Search, Trash2, ShieldCheck, ShieldOff, RefreshCw, Loader2, Edit2, Check, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { adminApi, type AdminUser } from "@/lib/api"
import { useAuth } from "@/context/auth"

function RoleBadge({ role }: { role: string }) {
  return role === "admin"
    ? <Badge variant="outline" className="text-[10px] font-semibold border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400">Admin</Badge>
    : <Badge variant="outline" className="text-[10px] font-medium border-border bg-muted text-muted-foreground">User</Badge>
}

function elapsed(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export function AdminUsers() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editThreshold, setEditThreshold] = useState(75)
  const [editRole, setEditRole] = useState<"user" | "admin">("user")
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error, setError] = useState("")

  function load() {
    setLoading(true)
    adminApi.users()
      .then(setUsers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.condition.toLowerCase().includes(search.toLowerCase())
  )

  function startEdit(u: AdminUser) {
    setEditingId(u.id)
    setEditThreshold(u.threshold)
    setEditRole(u.role)
  }

  async function saveEdit(id: number) {
    setSaving(true)
    try {
      const updated = await adminApi.updateUser(id, { role: editRole, threshold: editThreshold })
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updated } : u)))
      setEditingId(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  async function deleteUser(id: number) {
    if (!confirm("Delete this user? This cannot be undone.")) return
    setDeletingId(id)
    try {
      await adminApi.deleteUser(id)
      setUsers((prev) => prev.filter((u) => u.id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">User Management</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{users.length} registered users</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              placeholder="Search users…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 rounded-xl border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition w-56"
            />
          </div>
          <button onClick={load} className="h-9 w-9 flex items-center justify-center rounded-xl border border-input hover:bg-muted transition-colors">
            <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-500/8 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>
      )}

      <Card className="border shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Name / Email", "Condition", "Threshold", "Role", "Symptoms", "Joined", "Actions"].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-12 text-muted-foreground text-sm">Loading…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-muted-foreground text-sm">No users found</td></tr>
                ) : filtered.map((u) => {
                  const isEditing = editingId === u.id
                  const isMe = me?.id === u.id
                  return (
                    <tr key={u.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      {/* Name / Email */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground leading-tight">{u.name}{isMe && " (you)"}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Condition */}
                      <td className="px-4 py-3">
                        <span className="text-foreground">{u.condition}</span>
                        <p className="text-[10px] text-muted-foreground">{u.patient_id}</p>
                      </td>

                      {/* Threshold */}
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number" min={1} max={300}
                              value={editThreshold}
                              onChange={(e) => setEditThreshold(Number(e.target.value))}
                              className="h-7 w-16 rounded-lg border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                            />
                            <span className="text-xs text-muted-foreground">AQI</span>
                          </div>
                        ) : (
                          <span className="font-mono font-medium text-foreground">AQI {u.threshold}</span>
                        )}
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value as "user" | "admin")}
                            className="h-7 rounded-lg border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <RoleBadge role={u.role} />
                        )}
                      </td>

                      {/* Symptoms */}
                      <td className="px-4 py-3">
                        <span className={`font-semibold tabular-nums ${u.symptoms_count > 0 ? "text-orange-500" : "text-emerald-500"}`}>
                          {u.symptoms_count}
                        </span>
                      </td>

                      {/* Joined */}
                      <td className="px-4 py-3 text-muted-foreground text-xs">{elapsed(u.created_at)}</td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => saveEdit(u.id)}
                              disabled={saving}
                              className="h-7 w-7 flex items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 transition-colors"
                            >
                              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="h-7 w-7 flex items-center justify-center rounded-lg bg-muted text-muted-foreground hover:bg-muted/70 transition-colors"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => startEdit(u)}
                              className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                              title="Edit"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            {u.role === "admin"
                              ? <span title="Admin"><ShieldCheck className="h-3.5 w-3.5 text-purple-500 mx-1" /></span>
                              : <span title="Regular user"><ShieldOff className="h-3.5 w-3.5 text-muted-foreground mx-1" /></span>
                            }
                            <button
                              onClick={() => deleteUser(u.id)}
                              disabled={deletingId === u.id || isMe}
                              className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
                              title={isMe ? "Cannot delete yourself" : "Delete user"}
                            >
                              {deletingId === u.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
