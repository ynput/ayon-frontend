import { compareAsc } from 'date-fns'
import { useMemo } from 'react'
import groupActivityVersions from '../helpers/groupActivityVersions'
import groupMinorActivities from '../helpers/groupMinorActivities'
import mergeSimilarActivities from '../helpers/mergeSimilarActivities'

const getStatusActivityIcon = (activities = [], projectInfo = {}) => {
  return activities.map((activity) => {
    const newActivity = { ...activity, origin: { ...activity.origin } }

    // find status icon and data for status change activities
    if (newActivity.activityType === 'status.change') {
      if (!projectInfo) return newActivity
      const oldStatusName = newActivity.activityData?.oldValue
      const newStatusName = newActivity.activityData?.newValue

      const oldStatus = projectInfo.statuses?.find((status) => status.name === oldStatusName)
      const newStatus = projectInfo.statuses?.find((status) => status.name === newStatusName)

      newActivity.oldStatus = { ...oldStatus, name: oldStatusName }
      newActivity.newStatus = { ...newStatus, name: newStatusName }
    }

    return newActivity
  })
}

const filterOutRelations = (activities = [], entityTypes = [], entityType) => {
  return !entityTypes.includes(entityType)
    ? activities
    : activities.filter((activity) => activity.referenceType !== 'relation')
}

const useTransformActivities = (activities = [], projectInfo = {}, entityType) => {
  // 1. add status icons and data for status change activities
  const activitiesWithIcons = useMemo(
    () => getStatusActivityIcon(activities, projectInfo),
    [activities],
  )

  // 2. versions should not have relations shown (comments posted on parent task)
  const activitiesWithoutRelations = useMemo(
    () => filterOutRelations(activitiesWithIcons, ['version'], entityType),
    [activitiesWithIcons, projectInfo],
  )

  // 3. sort createdAt oldest first (because we are using flex: column-reverse)
  const reversedActivitiesData = useMemo(
    () =>
      activitiesWithoutRelations.sort((a, b) =>
        compareAsc(new Date(b.createdAt), new Date(a.createdAt)),
      ),
    [activitiesWithoutRelations],
  )

  // 4. for status change activities that are together, merge them into one activity
  const mergedActivitiesData = useMemo(
    () => mergeSimilarActivities(reversedActivitiesData, 'status.change', 'oldStatus'),
    [reversedActivitiesData],
  )

  // Define the types of activities that are considered minor
  const minorActivityTypes = ['status.change', 'assignee.add', 'assignee.remove', '']

  // 5. group minor activities together
  const groupedActivitiesData = useMemo(
    () => groupMinorActivities(mergedActivitiesData, minorActivityTypes),
    [mergedActivitiesData],
  )

  // 6. group version activities together
  const groupedVersionsData = useMemo(
    () => groupActivityVersions(groupedActivitiesData),
    [groupedActivitiesData],
  )

  return groupedVersionsData
}

export default useTransformActivities
