import { minorActivityTypes } from "../hooks/useTransformActivities"

const reduceMinorActivities = (activities) => ({
  ...activities[0],
  authorFullName: activities[0].authorFullName,
  activityType: activities[0].activityType,
  activityData: {
    ...activities[0].activityData,
    assignee: [...activities.map((a) => a.activityData.assignee)].join(', '),
  },
})

// they can be expanded to show all the minor activities in the feed
const groupMinorActivities = (activities) => {
  const groupedActivities = []
  let group = []

  const collapseGroup = (group) => {
    if (group.length == 1) {
      groupedActivities.push(group[0])
      return
    }

    const type = minorActivityTypes.filter((type) => type.status == group[0].activityType)[0]
    if (type.strategy == 'merge') {
      groupedActivities.push(reduceMinorActivities(group))
      return
    }

    groupedActivities.push(group[0])

    groupedActivities.push({
      activityType: 'group',
      items: group.slice(1),
      activityId: 'group-' + groupedActivities.length
    })
  }

  const types = minorActivityTypes.map((type) => type.status)

  let lastActivityType
  let lastAuthorFullName
  for (const activity of activities) {
    if (!types.includes(activity.activityType)) {
      if (group.length > 0){
        collapseGroup(group, groupedActivities.length)
        group = []
      }
      groupedActivities.push(activity)
      lastActivityType = null
      lastAuthorFullName = null
      continue
    }

    if (lastActivityType == null || lastActivityType == activity.activityType && lastAuthorFullName == activity.authorFullName) {
      group.push(activity)
      lastActivityType = activity.activityType
      lastAuthorFullName = activity.authorFullName
      continue
    }

    collapseGroup(group, groupedActivities.length)
    lastActivityType = activity.activityType
    group = [activity]
  }

  // After all activities have been processed, push the last group to the groupedActivities array
  if (group.length > 0) {
    collapseGroup(group, groupedActivities.length)
  }

  return groupedActivities
}

export default groupMinorActivities
