// @ts-nocheck

import { minorActivityTypes } from '../hooks/useTransformActivities'

// To keep the feed clean, we group minor activities.map((a) => a.activityData.assignee)].join(', '),
const groupMinorActivities = (activities, users) => {
  let mappedUsers = {}
  users.reduce((acc, currVal) => {
    acc[currVal.name] = currVal
    return acc
  }, mappedUsers)

  const groupedActivities = []
  // Initialize an empty array to hold the current group of minor activities
  let group = []

  const reduceMinorActivities = (activitiesGroup) => {
    const reduceActivities = (group) => {
      if (['assignee.add', 'assignee.remove'].includes(group[0].activityType)) {
        return [
          {
            ...group[0],
            activityType: group[0].activityType,
            assignee: [
              ...group.map(
                (a) =>
                  mappedUsers[a.activityData.assignee]?.attrib?.fullName || a.activityData.assignee,
              ),
            ].join(', '),
            activityData: {
              ...group[0].activityData,
              assignee: group
                .map(
                  (a) =>
                    mappedUsers[a.activityData.assignee]?.attrib?.fullName ||
                    a.activityData.assignee,
                )
                .join(', '),
            },
          },
        ]
      }

      return group
    }

    let groupedActivities = []
    let group = []
    let lastActivityType = null
    let lastAuthorName = null

    activitiesGroup.forEach((activity) => {
      if (
        lastActivityType === null ||
        (lastActivityType === activity.activityType && lastAuthorName == activity.authorName)
      ) {
        group.push(activity)
      } else {
        groupedActivities.push(...reduceActivities(group))
        group = [activity]
      }

      lastActivityType = activity.activityType
      lastAuthorName = activity.authorName
    })

    if (group.length != 0) {
      groupedActivities.push(...reduceActivities(group))
    }

    return groupedActivities
  }

  const pushGroupToActivities = (isFirstGroup, index) => {
    // If the group has more than two activities, push it as a group excluding the first item if it's the last group
    if (group.length > 2) {
      // Push the first item individually if it's the last group
      if (isFirstGroup) {
        const assignee = group[0].activityData.assignee
        groupedActivities.push({
          ...group[0],
          activityData: {
            ...group[0].activityData,
            assignee: mappedUsers[assignee]?.attrib.fullName || assignee,
          },
        })
      }
      // Push the rest of the group as a group
      groupedActivities.push({
        activityType: 'group',
        items: isFirstGroup ? reduceMinorActivities(group.slice(1)) : reduceMinorActivities(group),
        activityId: 'group-' + index,
      })
    }
    // If the group has one or two activities, push them individually
    else if (group.length > 0) {
      group.forEach((activity) => groupedActivities.push(activity))
    }
    // Reset the group
    group = []
  }

  for (const activity of activities) {
    // If the activity is a minor activity, add it to the current group
    if (minorActivityTypes.includes(activity.activityType)) {
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
  if (group.length > 0) {
    pushGroupToActivities(false, groupedActivities.length)
  }

  // Return the grouped activities
  return groupedActivities
}

export default groupMinorActivities
