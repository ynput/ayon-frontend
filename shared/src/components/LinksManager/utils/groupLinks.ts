import type { LinkEntity } from '../LinksManager'

export type GroupedLink = {
  groupKey: string
  entityId: string
  count: number
  linkIds: string[]
  representative: LinkEntity
}

/**
 * Groups links by entityId. Restricted links are never grouped
 * (we can't verify they're the same entity), each gets its own group.
 * Preserves sort order of first occurrence.
 */
export const groupLinksByEntity = (links: LinkEntity[]): GroupedLink[] => {
  const groupMap = new Map<string, GroupedLink>()
  const order: string[] = []

  for (const link of links) {
    // Restricted links get their own group keyed by linkId
    const key = link.isRestricted ? `restricted_${link.linkId}` : link.entityId

    const existing = groupMap.get(key)
    if (existing) {
      existing.count++
      existing.linkIds.push(link.linkId)
    } else {
      order.push(key)
      groupMap.set(key, {
        groupKey: key,
        entityId: link.entityId,
        count: 1,
        linkIds: [link.linkId],
        representative: link,
      })
    }
  }

  return order.map((key) => groupMap.get(key)!)
}
