const useGetContextParents = (activity: any, entityType?: string) => {
  let tag: string[] = []
  let tagTypes: Record<string, any> = {}

  if (activity.activityData.origin.type == 'folder' && !tagTypes.folder) {
    tagTypes.folder = true
    tag.push(activity.activityData.origin.name)
  }

  if (activity.activityData.origin.type == 'task' && !tagTypes.task) {
    tagTypes.task = true
    tag.push(activity.activityData.origin.name)
  }

  if (activity.activityData.origin.type == 'folder' && !tagTypes.folder) {
    tagTypes.folder = true
    tag.push(activity.activityData.origin.name)
  }

  if (entityType == 'version' || activity.activityData.origin.type == 'version') {
    if (!tagTypes.product) {
      tagTypes.product = true
      tag.push(activity.activityData.parents?.find((p: any) => p.type == 'product')?.name)
    }
    if (!tagTypes.version) {
      tagTypes.version = true
      tag.push(activity.activityData.origin.name)
    }
  }

  tag.filter((a) => !!a)
  return tag
}

export default useGetContextParents
