"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Wind } from "lucide-react"
import { setToken } from "@/lib/api"
import { auth } from "@/lib/api"
import { useAuth } from "@/context/auth"

// Landing page for Google OAuth redirect:
// Backend redirects here as /auth/callback?token=<jwt>
export default function AuthCallbackPage() {
  const router = useRouter()
  const { } = useAuth() // ensure provider is mounted

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get("token")

    if (!token) {
      router.replace("/login")
      return
    }

    // Store the token then validate it
    setToken(token)
    auth.me()
      .then(() => router.replace("/"))
      .catch(() => {
        router.replace("/login")
      })
  }, [router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center">
        <Wind className="h-7 w-7 text-primary" />
      </div>
      <div className="flex items-center gap-3 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Completing sign-in…
      </div>
    </div>
  )
}
