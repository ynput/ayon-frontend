import type { EntityListModel, EntityListPostModel } from '@shared/api'

// guest access and its activity categories belong to the shared list, not to a copy of it
const isGuestAccessKey = (key: string) => key === '__guests__' || key.startsWith('guest:')
const OMITTED_DATA_KEYS = ['publicLinks', 'guestActivityCategories']

// "Dailies" -> "Dailies (copy)", then "Dailies (copy 2)", ... skipping labels already taken
export const getDuplicateListLabel = (label: string, takenLabels: Iterable<string>): string => {
  const taken = new Set(takenLabels)
  const base = `${label} (copy)`
  if (!taken.has(base)) return base
  let n = 2
  while (taken.has(`${label} (copy ${n})`)) n++
  return `${label} (copy ${n})`
}

// the server has no copy endpoint: the full list (with items) is posted again as a new list.
// ids, owner and timestamps are left out so the server assigns new ones (the caller owns the copy)
export const buildDuplicateListPayload = (
  list: EntityListModel,
  label: string,
): EntityListPostModel => {
  const access = Object.fromEntries(
    Object.entries(list.access || {}).filter(([key]) => !isGuestAccessKey(key)),
  )
  const data = Object.fromEntries(
    Object.entries(list.data || {}).filter(([key]) => !OMITTED_DATA_KEYS.includes(key)),
  )
  const items = [...(list.items || [])]
    .sort((a, b) => a.position - b.position)
    // no position: items are appended in this order
    .map(({ entityId, label, attrib, data, tags }) => ({ entityId, label, attrib, data, tags }))

  return {
    label,
    entityType: list.entityType,
    entityListType: list.entityListType,
    entityListFolderId: list.entityListFolderId || undefined,
    access,
    attrib: list.attrib,
    data,
    template: list.template,
    tags: list.tags,
    // a copy of an archived list starts active, otherwise it would be hidden on creation
    active: true,
    items,
  }
}
