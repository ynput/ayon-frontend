import React from 'react'
import ActivityComment from './ActivityComment'
import ActivityStatusChange from './ActivityStatusChange/ActivityStatusChange'
import ActivityAssigneeChange from './ActivityAssigneeChange/ActivityAssigneeChange'

const ActivityItem = ({ activity, entityType, ...props }) => {
  switch (activity.activityType) {
    case 'comment':
      return <ActivityComment activity={activity} entityType={entityType} {...props} />
    case 'status.change':
      return <ActivityStatusChange activity={activity} {...props} />
    case 'assignee.add':
      return <ActivityAssigneeChange activity={activity} {...props} isAdding />
    case 'assignee.remove':
      return <ActivityAssigneeChange activity={activity} {...props} />

    default:
      return null
  }
}

export default ActivityItem
