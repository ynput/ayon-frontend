import { compareAsc } from 'date-fns'
import { cloneDeep } from 'lodash'
import { useMemo } from 'react'

const groupMinorActivities = (activities, types) => {
  const groupedActivities = []
  // Initialize an empty array to hold the current group of minor activities
  let group = []

  const pushGroupToActivities = (isFirstGroup, index) => {
    // If the group has more than two activities, push it as a group excluding the first item if it's the last group
    if (group.length > 2) {
      // Push the first item individually if it's the last group
      if (isFirstGroup) {
        groupedActivities.push(group[0])
      }
      // Push the rest of the group as a group
      groupedActivities.push({
        activityType: 'group',
        items: isFirstGroup ? group.slice(1) : group,
        activityId: 'group-' + index,
      })
    }
    // If the group has one or two activities, push them individually
    else {
      group.forEach((activity) => groupedActivities.push(activity))
    }
    // Reset the group
    group = []
  }

  for (const activity of activities) {
    // If the activity is a minor activity, add it to the current group
    if (types.includes(activity.activityType)) {
      group.push(activity)
    }
    // If the activity is not a minor activity, push the current group to the groupedActivities array and push the activity itself
    else {
      const isFirstGroup = groupedActivities.length === 0
      pushGroupToActivities(isFirstGroup, groupedActivities.length)
      groupedActivities.push(activity)
    }
  }

  // After all activities have been processed, push the last group to the groupedActivities array
  pushGroupToActivities(false, groupedActivities.length)

  // Return the grouped activities
  return groupedActivities
}

const mergeSimilarActivities = (activities, type, oldKey = 'oldValue') => {
  const mergedActivities = []
  let currentActivity = null

  for (const activity of activities) {
    if (activity.activityType === type) {
      if (!currentActivity) {
        // Start a new sequence of the same type
        currentActivity = cloneDeep(activity)
      } else if (currentActivity.authorName === activity.authorName) {
        // Continue the sequence, update the newValue from the current activity
        currentActivity[oldKey] = activity[oldKey]
        // also update newValue
        currentActivity.activityData.oldValue = activity.activityData.oldValue
        currentActivity.hasPreviousPage = activity.hasPreviousPage
        currentActivity.cursor = activity.cursor
      } else {
        // If the author is different, end the current sequence and start a new one
        if (currentActivity.activityData.oldValue !== currentActivity.activityData.newValue) {
          mergedActivities.push(currentActivity)
        }
        currentActivity = cloneDeep(activity)
      }
    } else {
      if (currentActivity) {
        // End of the sequence,
        // check the old value and new value are different
        if (currentActivity.activityData.oldValue !== currentActivity.activityData.newValue) {
          // push it to the merged activities
          mergedActivities.push(currentActivity)
        }
        currentActivity = null
      }
      // Push the activity of a different type
      mergedActivities.push(activity)
    }
  }

  // If there's a sequence left after the loop, push it to the merged activities
  if (
    currentActivity &&
    currentActivity.activityData.oldValue !== currentActivity.activityData.newValue &&
    !mergedActivities.some((activity) => activity.activityId === currentActivity.activityId)
  ) {
    mergedActivities.push(currentActivity)
  }

  return mergedActivities
}

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
  const minorActivityTypes = ['status.change', 'assignee.add', 'assignee.remove']

  // 5. Use the useMemo hook to optimize performance by memoizing the groupedActivitiesData
  const groupedActivitiesData = useMemo(
    () => groupMinorActivities(mergedActivitiesData, minorActivityTypes),
    [mergedActivitiesData],
  )

  return groupedActivitiesData
}

export default useTransformActivities
