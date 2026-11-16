/**
 * Suggests a free name for a copy of an access group: "artist_copy", then "artist_copy2", ...
 * existingNames are expected in lower case (names are compared case-insensitively).
 */
export const getDuplicateAccessGroupName = (sourceName: string, existingNames: string[]) => {
  const taken = new Set(existingNames.map((n) => n.toLowerCase()))
  const base = `${sourceName}_copy`
  if (!taken.has(base.toLowerCase())) return base
  let i = 2
  while (taken.has(`${base}${i}`.toLowerCase())) i++
  return `${base}${i}`
}
