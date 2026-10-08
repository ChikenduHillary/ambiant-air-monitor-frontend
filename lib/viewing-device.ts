// When set, the dashboard shows this device's readings (via its own key,
// deviceView.*) instead of the logged-in user's own devices (sensors.*).
// Lets a team testing one shared physical unit all point their dashboards
// at the same device without needing to log into the same account.
const STORAGE_KEY = "aeroguard_viewing_device_key"

export function getViewingDeviceKey(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(STORAGE_KEY)
}

export function setViewingDeviceKey(key: string) {
  localStorage.setItem(STORAGE_KEY, key)
  window.dispatchEvent(new Event("viewing-device-change"))
}

export function clearViewingDeviceKey() {
  localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new Event("viewing-device-change"))
}
