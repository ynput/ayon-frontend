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
    !mergedActivities.includes(currentActivity)
  ) {
    mergedActivities.push(currentActivity)
  }

  // If there's a sequence left after the loop, push it to the merged activities
  if (currentActivity && !mergedActivities.includes(currentActivity)) {
    mergedActivities.push(currentActivity)
  }

  return mergedActivities
}

const useTransformActivities = (activities = [], projectInfo = {}) => {
  const transformedActivitiesData = useMemo(() => {
    return activities.map((activity) => {
      const newActivity = { ...activity, origin: { ...activity.origin } }

      // find status icon and data for status change activities
      if (newActivity.activityType === 'status.change') {
        if (!projectInfo) return newActivity
        const oldStatusName = newActivity.activityData?.oldValue
        const newStatusName = newActivity.activityData?.newValue

        const oldStatus = projectInfo.statuses.find((status) => status.name === oldStatusName)
        const newStatus = projectInfo.statuses.find((status) => status.name === newStatusName)

        newActivity.oldStatus = { ...oldStatus, name: oldStatusName }
        newActivity.newStatus = { ...newStatus, name: newStatusName }
      }

      return newActivity
    })
  }, [activities])

  // sort createdAt oldest first (because we are using flex: column-reverse)
  const reversedActivitiesData = useMemo(
    () =>
      transformedActivitiesData.sort((a, b) =>
        compareAsc(new Date(a.createdAt), new Date(b.createdAt)),
      ),
    [transformedActivitiesData],
  )

  // for status change activities that are together, merge them into one activity
  const mergedActivitiesData = useMemo(
    () => mergeSimilarActivities(reversedActivitiesData, 'status.change', 'oldStatus'),
    [reversedActivitiesData],
  )

  // Define the types of activities that are considered minor
  const minorActivityTypes = ['status.change', 'assignee.add', 'assignee.remove']

  // Use the useMemo hook to optimize performance by memoizing the groupedActivitiesData
  const groupedActivitiesData = useMemo(
    () => groupMinorActivities(reversedActivitiesData, minorActivityTypes),
    [mergedActivitiesData],
  )

  return groupedActivitiesData
}

export default useTransformActivities
