import type { MentionEntityRef } from '../types'

// entity ids are uuid1 without dashes
const ENTITY_ID_REGEX = /^[0-9a-f]{32}$/

// entity types a pasted link can mention
const LINK_MENTION_TYPES = ['folder', 'task', 'version']

/**
 * A link to a folder, task or version on this server, as copied from the address bar:
 * `/projects/{project}/overview?project={project}&type=task&id={id}`. Links to a comment
 * (`activity=`) are left to `parseActivityLink`, links to other servers stay links.
 */
export const parseEntityLink = (href?: string | null): MentionEntityRef | null => {
  if (!href || typeof window === 'undefined') return null
  let url: URL
  try {
    url = new URL(href)
  } catch {
    return null
  }
  if (url.origin !== window.location.origin) return null
  if (url.searchParams.has('activity')) return null

  const type = url.searchParams.get('type')
  const id = url.searchParams.get('id')
  if (!type || !LINK_MENTION_TYPES.includes(type) || !id || !ENTITY_ID_REGEX.test(id)) return null

  const pathProject = url.pathname.match(/^\/projects\/([^/]+)/)?.[1]
  let projectName = url.searchParams.get('project') || pathProject
  if (!projectName) return null
  if (projectName === pathProject) {
    try {
      projectName = decodeURIComponent(projectName)
    } catch {
      /* keep the raw name */
    }
  }
  return { projectName, type, id }
}
