// Cached list items keep two attribute maps (see EntityListItem):
// listAttrib (set on the item) and entityAttrib (the entity's)
type CachedListItemValues = {
  listAttrib?: Record<string, unknown>
  entityAttrib?: Record<string, unknown>
}

// A null value removes the list value, so the item falls back to the entity's value
export const patchListItemListValues = (item: CachedListItemValues, values: object | undefined) => {
  if (!values) return
  const listAttrib = { ...item.listAttrib }
  for (const [key, value] of Object.entries(values)) {
    if (value === null || value === undefined) delete listAttrib[key]
    else listAttrib[key] = value
  }
  item.listAttrib = listAttrib
}

export const patchListItemEntityValues = (
  item: CachedListItemValues,
  values: object | undefined,
) => {
  if (!values) return
  item.entityAttrib = { ...item.entityAttrib, ...values }
}
