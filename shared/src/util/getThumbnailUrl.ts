export interface GetEntityThumbnailUrlParams {
  projectName: string
  entityType?: string // 'folder' | 'task' | 'version' | 'project' | etc.
  entityId?: string
  thumbnailId?: string // fallback path when no entityId/entityType is available
  thumbnailHash?: string // appended as ?hash= for cache busting; omitted if not provided
  placeholder?: 'empty' | 'none' // 'none' makes the API 404 instead of serving a blank image
}

/**
 * Builds a thumbnail URL for a project entity.
 *
 * Always uses `?hash=<thumbnailHash>` for cache busting when a hash is available.
 * If no hash is provided the URL is returned without any query parameter — never
 * falls back to `updatedAt` or similar fields.
 *
 * Returns `null` when the required identity information is missing.
 */
export const getEntityThumbnailUrl = ({
  projectName,
  entityType,
  entityId,
  thumbnailId,
  thumbnailHash,
  placeholder,
}: GetEntityThumbnailUrlParams): string | null => {
  if (!projectName) return null

  if (entityType === 'project') {
    return getProjectThumbnailUrl(projectName, thumbnailHash)
  }

  if (!thumbnailId && (!entityId || !entityType)) return null

  const params = new URLSearchParams()
  if (thumbnailHash) params.set('hash', thumbnailHash)
  if (placeholder) params.set('placeholder', placeholder)
  const query = params.toString() ? `?${params.toString()}` : ''

  if (entityId && entityType) {
    return `/api/projects/${projectName}/${entityType}s/${entityId}/thumbnail${query}`
  }

  // fallback: look up by thumbnailId
  return `/api/projects/${projectName}/thumbnails/${thumbnailId}${query}`
}

export const getProjectThumbnailUrl = (projectName: string, thumbnailHash?: string) => {
  if (!projectName) return null
  const hashParam = thumbnailHash ? `?hash=${thumbnailHash}` : ''
  return `/api/projects/${projectName}/thumbnail${hashParam}`
}

// Entity types that can have a filmstrip (resolved from their latest video reviewable)
export const FILMSTRIP_ENTITY_TYPES = ['folder', 'task', 'version']

export interface GetEntityFilmstripUrlParams {
  projectName?: string
  entityType?: string
  entityId?: string
  thumbnailHash?: string // appended as ?hash= for cache busting, same as thumbnails
}

/**
 * Builds a hover-scrub filmstrip URL for a project entity.
 *
 * Returns `null` for entity types without filmstrips (products, workfiles, projects...)
 * or when the required identity information is missing.
 */
export const getEntityFilmstripUrl = ({
  projectName,
  entityType,
  entityId,
  thumbnailHash,
}: GetEntityFilmstripUrlParams): string | null => {
  if (!projectName || !entityId || !entityType) return null
  if (!FILMSTRIP_ENTITY_TYPES.includes(entityType)) return null
  const hashParam = thumbnailHash ? `?hash=${thumbnailHash}` : ''
  return `/api/projects/${projectName}/${entityType}s/${entityId}/filmstrip${hashParam}`
}

/** Builds a hover-scrub filmstrip URL for a project file (e.g. a reviewable) */
export const getFileFilmstripUrl = (projectName?: string, fileId?: string): string | null => {
  if (!projectName || !fileId) return null
  return `/api/projects/${projectName}/files/${fileId}/filmstrip`
}
