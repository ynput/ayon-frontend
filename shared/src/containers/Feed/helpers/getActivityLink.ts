import { entityUrl } from '@ynput/ayon-addon'

// A link that opens the project page with the activity highlighted in the feed of its entity
// (the entity open in the details panel when no entity is given)
export const getActivityLink = (
  projectName: string,
  activityId: string,
  entity?: { id: string; type: string },
) => {
  const searchParams = new URLSearchParams(window.location.search)
  const entityType = entity?.type ?? searchParams.get('type')
  const id = entity?.id ?? searchParams.get('id')
  const url =
    entityType && id && entityUrl({ projectName, entityType, id }, { activity: activityId })
  if (url) return `${window.location.origin}${url}`

  // no entity with a page of its own: the project's overview, with the activity
  searchParams.set('activity', activityId)
  const fallback = new URL(`${window.location.origin}/projects/${projectName}/overview`)
  fallback.search = searchParams.toString()
  return fallback.toString()
}
