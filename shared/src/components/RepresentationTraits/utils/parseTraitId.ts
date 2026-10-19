export type ParsedTraitId = {
  id: string
  // dotted path before the name, e.g. `ayon.2d` (empty when the id has no dots)
  namespace: string
  name: string
  // null when the id has no `.v<number>` suffix
  version: number | null
  versionlessId: string
}

const VERSION_SUFFIX = /^(.+)\.v(\d+)$/

/** Splits a trait id like `ayon.2d.PixelBased.v1` or `shotgrid.moviepath.v1` into its parts. */
export const parseTraitId = (id: string): ParsedTraitId => {
  const match = VERSION_SUFFIX.exec(id)
  const versionlessId = match ? match[1] : id
  const version = match ? Number(match[2]) : null
  const parts = versionlessId.split('.')
  const name = parts.pop() || versionlessId

  return { id, namespace: parts.join('.'), name, version, versionlessId }
}
