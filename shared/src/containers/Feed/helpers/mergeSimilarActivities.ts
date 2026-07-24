import { differenceInSeconds, isValid } from 'date-fns'

// Takes activities of the same type and author and merges them into one activity
// activities must be within 20 seconds min of each other
// for example, if there are multiple status change activities by the same author
// they will be merged into one activity, resulting in a single status change activity

const mergeSimilarActivities = (activities: any[], type: string, oldKey: string = 'oldValue') => {
  const mergedActivities: any[] = []
  let currentActivity: any = null

  for (const activity of activities) {
    if (activity.activityType === type) {
      if (!currentActivity) {
        // Start a new sequence of the same type
        currentActivity = { ...activity }
        continue
      }

      const isSameAuthor = currentActivity.authorName === activity.authorName
      const isSameEntity = currentActivity.origin.id === activity.entityId
      // attrib changes only merge per attribute (key is undefined for other types)
      const isSameKey = currentActivity.activityData?.key === activity.activityData?.key
      const currentCreatedAt = new Date(currentActivity.createdAt)
      const activityCreatedAt = new Date(activity.createdAt)

      const seconds = 20
      const isWithinSeconds =
        isValid(currentCreatedAt) &&
        isValid(activityCreatedAt) &&
        Math.abs(differenceInSeconds(currentCreatedAt, activityCreatedAt)) <= seconds

      if (isSameAuthor && isWithinSeconds && isSameEntity && isSameKey) {
        // Continue the sequence, keep the old value from the earliest activity
        if (activity[oldKey] !== undefined) currentActivity[oldKey] = activity[oldKey]
        // Create a new activityData object instead of modifying the existing one
        currentActivity.activityData = {
          ...currentActivity.activityData,
          oldValue: activity.activityData.oldValue,
        }
        currentActivity.hasPreviousPage = activity.hasPreviousPage
        currentActivity.cursor = activity.cursor
      } else {
        // If the author is different, or not within 1 min, end the current sequence and start a new one
        if (currentActivity.activityData.oldValue !== currentActivity.activityData.newValue) {
          mergedActivities.push(currentActivity)
        }
        currentActivity = { ...activity }
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
