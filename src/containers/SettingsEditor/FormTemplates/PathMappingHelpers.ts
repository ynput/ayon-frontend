import { $Any } from '@types'

// Directory mapping (Maya and Nuke `DirmapPathsSubmodel`) stores its pairs as two lists
// matched by position. Other objects with two lists side by side hold unrelated lists
// (FFmpeg input and output arguments, families and tags), so only these names pair up.
export const SOURCE_FIELD = 'source_path'
export const DESTINATION_FIELD = 'destination_path'

const isStringList = (schema: $Any) => schema?.type === 'array' && schema.items?.type === 'string'

/** Whether an object is a directory mapping: exactly a source and a destination list */
export const isPathMappingSchema = (schema: $Any) => {
  const properties = schema?.properties
  if (schema?.type !== 'object' || !properties) return false
  const names = Object.keys(properties)
  return (
    names.length === 2 &&
    isStringList(properties[SOURCE_FIELD]) &&
    isStringList(properties[DESTINATION_FIELD])
  )
}

export type PathMappingData = {
  [SOURCE_FIELD]?: string[]
  [DESTINATION_FIELD]?: string[]
}

export type PathPair = { source: string; destination: string }

/**
 * The mapping as pairs. Saved lists may differ in length: the pairs run to the longer one,
 * with an empty value where the other list ends. Nothing is written until the user edits.
 */
export const getPathPairs = (data: PathMappingData | undefined): PathPair[] => {
  const sources = data?.[SOURCE_FIELD] ?? []
  const destinations = data?.[DESTINATION_FIELD] ?? []
  const count = Math.max(sources.length, destinations.length)
  return Array.from({ length: count }, (_, i) => ({
    source: sources[i] ?? '',
    destination: destinations[i] ?? '',
  }))
}

/** The two lists for a set of pairs, always of the same length */
export const toPathMappingData = (data: PathMappingData | undefined, pairs: PathPair[]) => ({
  ...data,
  [SOURCE_FIELD]: pairs.map((pair) => pair.source),
  [DESTINATION_FIELD]: pairs.map((pair) => pair.destination),
})

export const setPairValue = (
  pairs: PathPair[],
  index: number,
  side: keyof PathPair,
  value: string,
) => pairs.map((pair, i) => (i === index ? { ...pair, [side]: value } : pair))

export const addPair = (pairs: PathPair[]) => [...pairs, { source: '', destination: '' }]

export const removePair = (pairs: PathPair[], index: number) => pairs.filter((_, i) => i !== index)

export const movePair = (pairs: PathPair[], from: number, to: number) => {
  const result = [...pairs]
  const [moved] = result.splice(from, 1)
  result.splice(to, 0, moved)
  return result
}
