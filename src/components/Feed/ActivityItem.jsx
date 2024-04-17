import React from 'react'
import ActivityComment from './ActivityComment/ActivityComment'
import ActivityStatusChange from './ActivityStatusChange/ActivityStatusChange'
import ActivityAssigneeChange from './ActivityAssigneeChange/ActivityAssigneeChange'
import ActivityGroup from './ActivityGroup/ActivityGroup'

const ActivityItem = ({ activity = {}, fromGroup, projectsInfo = {}, editProps, ...props }) => {
  // extra out projectInfo for item
  const { projectName } = activity
  const projectInfo = projectsInfo[projectName] || {}

  switch (activity.activityType) {
    case 'comment':
      return <ActivityComment {...{ activity, projectInfo, editProps }} {...props} />
    case 'status.change':
      return <ActivityStatusChange activity={activity} {...props} />
    case 'assignee.add':
      return <ActivityAssigneeChange activity={activity} {...props} isAdding />
    case 'assignee.remove':
      return <ActivityAssigneeChange activity={activity} {...props} />
    case 'group':
      // fromGroup prevents infinite recursion
      return !fromGroup && <ActivityGroup activities={activity.items} {...props} />
    default:
      return null
  }
}

export default ActivityItem
