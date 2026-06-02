const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1"

const TOKEN_KEY = "aeroguard_token"

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
  // Non-httpOnly cookie so Next.js middleware can check it
  document.cookie = `auth-token=${token}; path=/; SameSite=Lax; max-age=${7 * 24 * 3600}`
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
  document.cookie = "auth-token=; path=/; max-age=0"
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }
  if (token) headers["Authorization"] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { ...options, headers })

  if (res.status === 401) {
    clearToken()
    window.location.href = "/login"
    throw new Error("Unauthorized")
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`)
  }

  return res.json() as Promise<T>
}

export function googleLoginUrl(): string {
  return `${BASE}/auth/google`
}

// ── auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: number
  name: string
  email: string
  condition: string
  patient_id: string
  threshold: number
  role: "user" | "admin"
}

export interface AuthResponse {
  token: string
  user: AuthUser
}

export const auth = {
  register: (body: { name: string; email: string; password: string; condition?: string }) =>
    request<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(body) }),

  login: (body: { email: string; password: string }) =>
    request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(body) }),

  me: () => request<AuthUser>("/auth/me"),
}

// ── sensors ──────────────────────────────────────────────────────────────────

export interface SensorReading {
  id: number
  timestamp: string
  pm25: number
  voc: number
  temperature: number
  humidity: number
  aqi: number
}

export interface DailyAggregate {
  date: string
  pm25: number
  voc: number
  aqi: number
  symptoms: number
}

export const sensors = {
  current: () => request<SensorReading>("/sensors/current"),
  hourly: () => request<SensorReading[]>("/sensors/hourly"),
  daily: (days: number) => request<DailyAggregate[]>(`/sensors/daily?days=${days}`),
}

// ── alerts ───────────────────────────────────────────────────────────────────

export interface Alert {
  id: number
  message: string
  level: "warning" | "info" | "success"
  read: boolean
  created_at: string
}

export const alerts = {
  list: (limit = 20) => request<Alert[]>(`/alerts?limit=${limit}`),
  markRead: (id: number) => request<void>(`/alerts/${id}/read`, { method: "PUT" }),
}

// ── symptoms ─────────────────────────────────────────────────────────────────

export interface SymptomLog {
  id: number
  symptoms: string[]
  severity: number
  triggers: string[]
  notes: string
  created_at: string
}

export interface CreateSymptomPayload {
  symptoms: string[]
  severity: number
  triggers: string[]
  notes: string
}

export const symptoms = {
  list: () => request<SymptomLog[]>("/symptoms"),
  create: (payload: CreateSymptomPayload) =>
    request<SymptomLog>("/symptoms", { method: "POST", body: JSON.stringify(payload) }),
}

// ── admin ─────────────────────────────────────────────────────────────────────

export interface AdminStats {
  total_users: number
  total_readings: number
  total_alerts: number
  total_symptoms: number
  active_alerts: number
  avg_aqi_today: number
  last_reading_at: string | null
}

export interface AdminUser {
  id: number
  name: string
  email: string
  condition: string
  patient_id: string
  threshold: number
  role: "user" | "admin"
  created_at: string
  symptoms_count: number
}

export interface AdminSymptomLog extends SymptomLog {
  user_name: string
  user_email: string
}

export const adminApi = {
  stats: () => request<AdminStats>("/admin/stats"),

  users: () => request<AdminUser[]>("/admin/users"),
  updateUser: (id: number, body: { role?: string; threshold?: number; condition?: string; name?: string }) =>
    request<AdminUser>(`/admin/users/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteUser: (id: number) => request<void>(`/admin/users/${id}`, { method: "DELETE" }),

  alerts: (limit = 100) => request<Alert[]>(`/admin/alerts?limit=${limit}`),
  broadcastAlert: (body: { message: string; level: string }) =>
    request<Alert>("/admin/alerts", { method: "POST", body: JSON.stringify(body) }),
  deleteAlert: (id: number) => request<void>(`/admin/alerts/${id}`, { method: "DELETE" }),
  markAllAlertsRead: () => request<void>("/admin/alerts/read-all", { method: "PUT" }),

  sensors: (limit = 200) => request<SensorReading[]>(`/admin/sensors?limit=${limit}`),
  deleteReading: (id: number) => request<void>(`/admin/sensors/${id}`, { method: "DELETE" }),
  exportUrl: () => `${BASE}/admin/sensors/export`,

  symptoms: (limit = 100) => request<AdminSymptomLog[]>(`/admin/symptoms?limit=${limit}`),
}
