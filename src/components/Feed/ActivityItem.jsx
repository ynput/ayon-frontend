import React from 'react'
import ActivityComment from './ActivityComment'
import ActivityStatusChange from './ActivityStatusChange/ActivityStatusChange'
import ActivityAssigneeChange from './ActivityAssigneeChange/ActivityAssigneeChange'
import ActivityGroup from './ActivityGroup/ActivityGroup'

const ActivityItem = ({ activity, fromGroup, ...props }) => {
  switch (activity.activityType) {
    case 'comment':
      return <ActivityComment activity={activity} {...props} />
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
