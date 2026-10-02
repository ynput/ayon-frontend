// activity ids are uuid1 without dashes
const ACTIVITY_ID_REGEX = /^[0-9a-f]{32}$/

/**
 * The link a duplicated comment keeps to the comment it was copied from:
 * `source:{activityId}?type={entityType}&id={entityId}`. The entity is the one the source comment
 * belongs to, which can differ from the entity the copy is posted on.
 */
export const getSourceLink = (activityId: string, entity?: { id: string; type: string }) =>
  `source:${activityId}` +
  (entity ? `?${new URLSearchParams({ type: entity.type, id: entity.id })}` : '')

/**
 * A link to a comment (any activity) on this server: `/projects/{project}/...?activity={id}`, as
 * made by a comment's "Copy link", or a source link (`getSourceLink`).
 * Links to other servers stay links.
 */
export type ParsedActivityLink =
  | {
      activityId: string
      // the source comment's entity, missing on links without it (resolve with the containing comment's)
      entity: { id: string; type: string } | null
      isSource: true
    }
  | {
      projectName: string
      activityId: string
      entityId: string | null
      isSource: false
      url: string
    }

export const parseActivityLink = (href?: string | null): ParsedActivityLink | null => {
  if (!href) return null
  const sourceMatch = href.match(/^source:([0-9a-f]{32})(?:\?(.*))?$/)
  if (sourceMatch) {
    const params = new URLSearchParams(sourceMatch[2] ?? '')
    const id = params.get('id')
    const type = params.get('type')
    return {
      activityId: sourceMatch[1],
      entity: id && type && ACTIVITY_ID_REGEX.test(id) ? { id, type } : null,
      isSource: true,
    }
  }
  if (href.startsWith('source:') || typeof window === 'undefined') return null

  let url: URL
  try {
    url = new URL(href, window.location.origin)
  } catch {
    return null
  }
  if (url.origin !== window.location.origin) return null
  const project = url.pathname.match(/^\/projects\/([^/]+)/)?.[1]
  const activityId = url.searchParams.get('activity')
  if (!project || !activityId || !ACTIVITY_ID_REGEX.test(activityId)) return null
  const link = {
    activityId,
    entityId: url.searchParams.get('id'),
    isSource: false as const,
    url: url.toString(),
  }
  try {
    return { projectName: decodeURIComponent(project), ...link }
  } catch {
    return { projectName: project, ...link }
  }
}

// the label of a comment link that has none of its own (e.g. a pasted "Copy link" url)
export const ACTIVITY_LINK_LABEL = 'Comment'
