// activity ids are uuid1 without dashes
const ACTIVITY_ID_REGEX = /^[0-9a-f]{32}$/

/**
 * A link to a comment (any activity) on this server: `/projects/{project}/...?activity={id}`, as
 * made by a comment's "Copy link". Source links prefix the URL with `source:`.
 * Links to other servers stay links.
 */
export type ParsedActivityLink =
  | { activityId: string; isSource: true }
  | {
      projectName: string
      activityId: string
      entityId: string | null
      isSource: false
      url: string
    }

export const parseActivityLink = (href?: string | null): ParsedActivityLink | null => {
  if (!href) return null
  const sourceMatch = href.match(/^source:([0-9a-f]{32})$/)
  if (sourceMatch) return { activityId: sourceMatch[1], isSource: true }
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
