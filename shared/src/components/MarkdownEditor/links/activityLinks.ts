// activity ids are uuid1 without dashes
const ACTIVITY_ID_REGEX = /^[0-9a-f]{32}$/

/**
 * A link to a comment (any activity) on this server: `/projects/{project}/...?activity={id}`, as
 * made by a comment's "Copy link". These are shown as a chip like mentions, but stay plain
 * markdown links. Links to other servers stay links.
 */
export const parseActivityLink = (
  href?: string | null,
): { projectName: string; activityId: string } | null => {
  if (!href || typeof window === 'undefined') return null
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
  try {
    return { projectName: decodeURIComponent(project), activityId }
  } catch {
    return { projectName: project, activityId }
  }
}

// the label of a comment link that has none of its own (e.g. a pasted "Copy link" url)
export const ACTIVITY_LINK_LABEL = 'Comment'
