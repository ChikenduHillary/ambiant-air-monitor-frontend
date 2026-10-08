import { NextRequest, NextResponse } from "next/server"

// Redirect away from these if already logged in (they're for logging in).
const AUTH_PATHS = ["/login", "/auth/callback"]
// Never redirect these either way — accessible with or without a session.
const PUBLIC_PATHS: string[] = []

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p))
  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  const token = request.cookies.get("auth-token")?.value

  if (!isAuthPath && !isPublicPath && !token) {
    const loginUrl = new URL("/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthPath && token) {
    const dashboardUrl = new URL("/", request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
