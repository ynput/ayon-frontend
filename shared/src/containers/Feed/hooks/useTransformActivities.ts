// @ts-nocheck

import { compareAsc, isValid } from 'date-fns'
import { useMemo } from 'react'
import groupActivityVersions from '../helpers/groupActivityVersions'
import groupMinorActivities, { ActivityUser } from '../helpers/groupMinorActivities'
import mergeSimilarActivities from '../helpers/mergeSimilarActivities'

// Define the types of activities that are considered minor
const minorActivityTypes = ['status.change', 'assignee.add', 'assignee.remove']

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

const useTransformActivities = (
  activities = [],
  users: ActivityUser[] = [],
  projectInfo = {},
  entityType,
  userName,
) => {
  // 1. add status icons and data for status change activities
  const activitiesWithIcons = useMemo(
    () => getStatusActivityIcon(activities, projectInfo),
    [activities],
  )

  // add any extra meta data to the activities
  const activitiesWithMeta = useMemo(() => {
    return activitiesWithIcons.map((activity) => {
      const newActivity = { ...activity, isOwner: userName === activity.authorName }
      return newActivity
    })
  }, [activitiesWithIcons, userName])

  // 2. versions should not have relations shown (comments posted on parent task)
  const activitiesWithoutRelations = useMemo(
    () => filterOutRelations(activitiesWithMeta, ['version'], entityType),
    [activitiesWithMeta, projectInfo],
  )

  // 3. sort createdAt oldest first (because we are using flex: column-reverse)
  const reversedActivitiesData = useMemo(() => {
    const sortedActivities = [...activitiesWithoutRelations].sort((a, b) => {
      const dateA = new Date(a.createdAt)
      const dateB = new Date(b.createdAt)
      const validA = isValid(dateA)
      const validB = isValid(dateB)

      if (!validA && !validB) {
        return 0 // Both dates are invalid, keep original order
      } else if (!validA) {
        return 1 // Only dateA is invalid, it comes first
      } else if (!validB) {
        return -1 // Only dateB is invalid, dateA comes first
      }

      // If both dates are valid, compare them normally
      return compareAsc(dateB, dateA)
    })

    return sortedActivities
  }, [activitiesWithoutRelations])

  // 4. for status change activities that are together, merge them into one activity
  const mergedActivitiesData = useMemo(
    () => mergeSimilarActivities(reversedActivitiesData, 'status.change', 'oldStatus'),
    [reversedActivitiesData],
  )

  // 5. group minor activities together
  const groupedActivitiesData = useMemo(
    () => groupMinorActivities(mergedActivitiesData, users),
    [mergedActivitiesData, users],
  )

  // 6. group version activities together
  const groupedVersionsData = useMemo(
    () => groupActivityVersions(groupedActivitiesData),
    [groupedActivitiesData],
  )

  // 7. ensure there are no duplicate activities
  const uniqueActivitiesData = useMemo(() => {
    // Filter out invalid activities and create a Map to ensure uniqueness
    const activityMap = new Map(
      groupedVersionsData
        .filter((activity) => activity && activity.activityId)
        .map((activity) => [activity.activityId, activity]),
    )

    // Convert the Map values to an array
    return [...activityMap.values()]
  }, [groupedVersionsData])

  return uniqueActivitiesData
}

export { minorActivityTypes }
export default useTransformActivities
