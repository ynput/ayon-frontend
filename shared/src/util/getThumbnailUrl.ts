export interface GetEntityThumbnailUrlParams {
  projectName: string
  entityType?: string // 'folder' | 'task' | 'version' | 'project' | etc.
  entityId?: string
  thumbnailId?: string // fallback path when no entityId/entityType is available
  thumbnailHash?: string // appended as ?hash= for cache busting; omitted if not provided
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
}: GetEntityThumbnailUrlParams): string | null => {
  if (!projectName) return null

  if (entityType === 'project') {
    return getProjectThumbnailUrl(projectName, thumbnailHash)
  }

  if (!thumbnailId && (!entityId || !entityType)) return null

  const hashParam = thumbnailHash ? `?hash=${thumbnailHash}` : ''

  if (entityId && entityType) {
    return `/api/projects/${projectName}/${entityType}s/${entityId}/thumbnail${hashParam}`
  }

  // fallback: look up by thumbnailId
  return `/api/projects/${projectName}/thumbnails/${thumbnailId}${hashParam}`
}

export const getProjectThumbnailUrl = (projectName: string, thumbnailHash?: string) => {
  if (!projectName) return null
  const hashParam = thumbnailHash ? `?hash=${thumbnailHash}` : ''
  return `/api/projects/${projectName}/thumbnail${hashParam}`
}
