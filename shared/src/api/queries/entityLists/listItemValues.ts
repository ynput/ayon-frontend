// Cached list items keep three attribute maps (see EntityListItem):
// listAttrib (set on the item), entityAttrib (the entity's) and attrib (list over entity).
type CachedListItemValues = {
  attrib?: Record<string, unknown>
  listAttrib?: Record<string, unknown>
  entityAttrib?: Record<string, unknown>
}

// A null value removes the list value, so the item falls back to the entity's value
export const patchListItemListValues = (item: CachedListItemValues, values: object | undefined) => {
  if (!values) return
  const listAttrib = { ...item.listAttrib }
  const attrib = { ...item.attrib }
  for (const [key, value] of Object.entries(values)) {
    if (value === null || value === undefined) {
      delete listAttrib[key]
      attrib[key] = item.entityAttrib?.[key]
    } else {
      listAttrib[key] = value
      attrib[key] = value
    }
  }
  item.listAttrib = listAttrib
  item.attrib = attrib
}

export const patchListItemEntityValues = (
  item: CachedListItemValues,
  values: object | undefined,
) => {
  if (!values) return
  const attrib = { ...item.attrib }
  for (const [key, value] of Object.entries(values)) {
    if (!(key in (item.listAttrib || {}))) attrib[key] = value
  }
  item.entityAttrib = { ...item.entityAttrib, ...values }
  item.attrib = attrib
}
