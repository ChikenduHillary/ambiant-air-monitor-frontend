// Whether to play a sound when a new alert (threshold breach) comes in.
// Defaults to on — absence of the key means enabled, not disabled.
const STORAGE_KEY = "aeroguard_alert_sound_enabled"

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return true
  return localStorage.getItem(STORAGE_KEY) !== "off"
}

export function setSoundEnabled(enabled: boolean) {
  localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off")
  window.dispatchEvent(new Event("sound-pref-change"))
}
