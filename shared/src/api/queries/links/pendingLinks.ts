import type { EntityLink } from '@shared/api'

// Optimistically-created links live here until the backend's link query catches up.
// Background reconciles (websocket flush, forced refetch) replace an entity's links
// wholesale with server data; without this registry a server response that arrives
// before the new link is queryable would erase the just-created link.

type PendingEntry = {
  link: EntityLink
  addedAt: number
}

const TTL = 30_000

// entityId -> optimistic links awaiting server confirmation
const pendingByEntity = new Map<string, PendingEntry[]>()

const notExpired = (entries: PendingEntry[]): PendingEntry[] =>
  entries.filter((e) => Date.now() - e.addedAt < TTL)

export const registerPendingLink = (entityId: string, link: EntityLink) => {
  if (!entityId || !link?.id) return
  const existing = notExpired(pendingByEntity.get(entityId) || []).filter(
    (e) => e.link.id !== link.id,
  )
  existing.push({ link, addedAt: Date.now() })
  pendingByEntity.set(entityId, existing)
}

export const unregisterPendingLink = (linkId: string) => {
  if (!linkId) return
  for (const [entityId, entries] of pendingByEntity) {
    const next = entries.filter((e) => e.link.id !== linkId)
    if (next.length) pendingByEntity.set(entityId, next)
    else pendingByEntity.delete(entityId)
  }
}

// Re-append optimistic links the server hasn't returned yet; drop ones it now has.
export const preservePendingLinks = (
  entityId: string,
  serverLinks: EntityLink[],
): EntityLink[] => {
  const entries = notExpired(pendingByEntity.get(entityId) || [])
  if (!entries.length) {
    pendingByEntity.delete(entityId)
    return serverLinks
  }

  const serverLinkIds = new Set(serverLinks.map((l) => l.id))
  const stillPending: PendingEntry[] = []
  const toAppend: EntityLink[] = []

  for (const entry of entries) {
    if (serverLinkIds.has(entry.link.id)) continue // server caught up
    stillPending.push(entry)
    toAppend.push(entry.link)
  }

  if (stillPending.length) pendingByEntity.set(entityId, stillPending)
  else pendingByEntity.delete(entityId)

  return toAppend.length ? [...serverLinks, ...toAppend] : serverLinks
}
