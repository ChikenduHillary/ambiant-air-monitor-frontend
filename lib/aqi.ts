export function getAqiCategory(aqi: number) {
  if (aqi <= 50) return { label: "Good", color: "#34d399" }
  if (aqi <= 100) return { label: "Moderate", color: "#f59e0b" }
  if (aqi <= 150) return { label: "Unhealthy for Sensitive", color: "#f97316" }
  if (aqi <= 200) return { label: "Unhealthy", color: "#ef4444" }
  return { label: "Hazardous", color: "#9b1c1c" }
}
