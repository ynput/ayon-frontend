// A link that opens the project page with the activity highlighted in the feed of its entity
// (the entity open in the details panel when no entity is given)
export const getActivityLink = (
  projectName: string,
  activityId: string,
  entity?: { id: string; type: string },
) => {
  const searchParams = new URLSearchParams(window.location.search)
  if (entity) {
    searchParams.set('project', projectName)
    searchParams.set('type', entity.type)
    searchParams.set('id', entity.id)
  }
  const tab = searchParams.get('type') === 'version' ? 'products' : 'overview'
  searchParams.set('activity', activityId)
  const url = new URL(`${window.location.origin}/projects/${projectName}/${tab}`)
  url.search = searchParams.toString()
  return url.toString()
}
