import { intervalToDuration, isValid } from 'date-fns'
import { cloneDeep } from 'lodash'

// Takes activities of the same type and author and merges them into one activity
// activities must be within one min of each other
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
        continue
      }

      const isSameAuthor = currentActivity.authorName === activity.authorName
      const isSameEntity = currentActivity.origin.id=== activity.entityId
      const currentCreatedAt = new Date(currentActivity.createdAt)
      const activityCreatedAt = new Date(activity.createdAt)
      const activityDuration =
        isValid(currentCreatedAt) &&
        isValid(activityCreatedAt) &&
        intervalToDuration({ start: activityCreatedAt, end: currentCreatedAt })

      // If the activity is within 1 min of the current activity
      const seconds = 20
      const isWithinSeconds =
        !('minutes' in activityDuration) && activityDuration.seconds <= seconds

      if (isSameAuthor && isWithinSeconds && isSameEntity) {
        // Continue the sequence, update the newValue from the current activity
        currentActivity[oldKey] = activity[oldKey]
        // also update newValue
        currentActivity.activityData.oldValue = activity.activityData.oldValue
        currentActivity.hasPreviousPage = activity.hasPreviousPage
        currentActivity.cursor = activity.cursor
      } else {
        // If the author is different, or not within 1 min, end the current sequence and start a new one
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
