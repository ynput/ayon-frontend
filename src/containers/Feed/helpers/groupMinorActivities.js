// To keep the feed clean, we group minor activities together
// they can be expanded to show all the minor activities in the feed

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

export default groupMinorActivities
