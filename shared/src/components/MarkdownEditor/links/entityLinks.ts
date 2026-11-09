import { entityUrl } from '@ynput/ayon-addon'
import type { MentionEntityRef } from '../types'

// entity ids are uuid1 without dashes
const ENTITY_ID_REGEX = /^[0-9a-f]{32}$/

// entity types a pasted link or a drop can mention
const LINK_MENTION_TYPES = ['folder', 'task', 'version']

const isMentionRef = (ref: unknown): ref is MentionEntityRef => {
  const { projectName, type, id } = (ref ?? {}) as Partial<MentionEntityRef>
  return (
    typeof projectName === 'string' &&
    !!projectName &&
    typeof type === 'string' &&
    LINK_MENTION_TYPES.includes(type) &&
    typeof id === 'string' &&
    ENTITY_ID_REGEX.test(id)
  )
}

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

// the link to an entity on this server, as `parseEntityLink` reads it
export const getEntityLink = ({ projectName, type, id }: MentionEntityRef) => {
  const url = entityUrl({ projectName, entityType: type, id })
  return url ? new URL(url, window.location.origin).href : null
}

// entities dragged from a table, an editor drops them as mentions
export const ENTITY_DRAG_TYPE = 'application/x-ayon-entities'

export const setEntityDragData = (dataTransfer: DataTransfer, refs: MentionEntityRef[]) => {
  dataTransfer.setData(ENTITY_DRAG_TYPE, JSON.stringify(refs))
  // other inputs and apps get the links
  dataTransfer.setData('text/plain', refs.map(getEntityLink).filter(Boolean).join('\n'))
  dataTransfer.effectAllowed = 'copy'
}

export const getEntityDragData = (dataTransfer: DataTransfer | null): MentionEntityRef[] => {
  const data = dataTransfer?.getData(ENTITY_DRAG_TYPE)
  if (!data) return []
  try {
    const refs: unknown = JSON.parse(data)
    return Array.isArray(refs) ? refs.filter(isMentionRef) : []
  } catch {
    return []
  }
}
