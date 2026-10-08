// Tracks the last sensor reading id we've seen across the whole app (module
// scope, not per-component) so a new reading is only announced once even
// when multiple components poll /sensors/current concurrently.
let lastSeenId: number | null = null

export function isNewReading(id: number): boolean {
  const isNew = lastSeenId !== null && id !== lastSeenId
  lastSeenId = id
  return isNew
}
