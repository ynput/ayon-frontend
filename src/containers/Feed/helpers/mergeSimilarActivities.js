import { cloneDeep } from 'lodash'

// Takes activities of the same type and author and merges them into one activity
// for example, if there are multiple status change activities by the same author
// they will be merged into one activity, resulting in a single status change activity

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

export default mergeSimilarActivities
