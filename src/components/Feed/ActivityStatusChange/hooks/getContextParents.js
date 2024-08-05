import { useSelector } from "react-redux"

const useGetContextParents = (activity, entityType) => {
  const focusedFolders = useSelector((state) => state.context.focused.folders)
  let tag = []
  let tagTypes = {}


  if (activity.activityData.origin.type == 'folder' && !tagTypes.folder) {
    tagTypes.folder = true
    tag.push(activity.activityData.origin.name)
  }

  if (focusedFolders?.length > 1 && !tagTypes.folder) {
    tagTypes.folder = true
    tag.push(activity.activityData.parents?.find((p) => p.type == 'folder')?.name)
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
      tag.push(activity.activityData.parents?.find((p) => p.type == 'product')?.name)
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