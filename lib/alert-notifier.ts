// Tracks the newest alert id we've seen (module scope, so it survives
// across polls regardless of which component triggered them) so a
// threshold-breach alert only plays its sound once.
let lastSeenAlertId: number | null = null

export function hasNewAlert(alertIds: number[]): boolean {
  if (alertIds.length === 0) return false
  const maxId = Math.max(...alertIds)
  const isNew = lastSeenAlertId !== null && maxId > lastSeenAlertId
  lastSeenAlertId = Math.max(lastSeenAlertId ?? maxId, maxId)
  return isNew
}
