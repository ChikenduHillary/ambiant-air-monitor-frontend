"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Cpu, Plus, Trash2, Copy, Check, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { devices as devicesApi, type Device, type NewDevice } from "@/lib/api"

function relativeTime(iso: string | null) {
  if (!iso) return "Never connected"
  const ms = Date.now() - new Date(iso).getTime()
  const m = Math.floor(ms / 60000)
  if (m < 1) return "Just now"
  if (m < 60) return `${m} min ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} hr ago`
  return `${Math.floor(h / 24)} d ago`
}

export function DeviceSettings() {
  const [deviceList, setDeviceList] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [creating, setCreating] = useState(false)
  const [newDevice, setNewDevice] = useState<NewDevice | null>(null)
  const [copied, setCopied] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Device | null>(null)

  async function load() {
    try {
      setDeviceList(await devicesApi.list())
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load devices")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleCreate() {
    setCreating(true)
    try {
      const created = await devicesApi.create(newName.trim() || "AeroGuard Node")
      setNewDevice(created)
      setNewName("")
      setDeviceList((prev) => [{ id: created.id, name: created.name, created_at: created.created_at, last_seen_at: null }, ...prev])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create device")
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await devicesApi.remove(deleteTarget.id)
      setDeviceList((prev) => prev.filter((d) => d.id !== deleteTarget.id))
      toast.success(`"${deleteTarget.name}" revoked`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to revoke device")
    } finally {
      setDeleteTarget(null)
    }
  }

  function copyKey() {
    if (!newDevice) return
    navigator.clipboard.writeText(newDevice.device_key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function closeAddFlow() {
    setAddOpen(false)
    setNewDevice(null)
    setCopied(false)
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-semibold">Your Devices</CardTitle>
        <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Add Device
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 border rounded-xl p-4">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div className="flex-1 flex flex-col gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))
        ) : deviceList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
            <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center">
              <Cpu className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">No devices yet</p>
              <p className="text-xs text-muted-foreground mt-1">Add a device to get a key for its secrets.h file.</p>
            </div>
          </div>
        ) : (
          deviceList.map((d) => (
            <div key={d.id} className="flex items-center gap-3 border rounded-xl p-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Cpu className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{d.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{relativeTime(d.last_seen_at)}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive shrink-0"
                onClick={() => setDeleteTarget(d)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </CardContent>

      {/* Add device dialog */}
      <Dialog open={addOpen} onOpenChange={(open) => !open && closeAddFlow()}>
        <DialogContent>
          {!newDevice ? (
            <>
              <DialogHeader>
                <DialogTitle>Add a device</DialogTitle>
                <DialogDescription>
                  Give it a name you'll recognize, then paste the generated key into that device's secrets.h.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-2 py-2">
                <Label htmlFor="device-name">Device name</Label>
                <Input
                  id="device-name"
                  placeholder="Living Room Node"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeAddFlow}>Cancel</Button>
                <Button onClick={handleCreate} disabled={creating}>
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Device key — save this now</DialogTitle>
                <DialogDescription>
                  This is the only time this key is shown. Paste it into the device's secrets.h as DEVICE_API_KEY.
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center gap-2 bg-muted rounded-lg p-3 font-mono text-xs break-all">
                <span className="flex-1">{newDevice.device_key}</span>
                <Button variant="ghost" size="icon" className="shrink-0 h-7 w-7" onClick={copyKey}>
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
              <DialogFooter>
                <Button onClick={closeAddFlow}>I've saved it</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Revoke confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This device's key stops working immediately. Past readings stay in your history, but it can't send new ones until you add it again with a new key.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
