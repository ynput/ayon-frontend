import React from 'react'
import ActivityComment from './ActivityComment'
import ActivityStatusChange from './ActivityStatusChange/ActivityStatusChange'

const ActivityItem = ({ activity, entityType, ...props }) => {
  switch (activity.activityType) {
    case 'comment':
      return <ActivityComment activity={activity} entityType={entityType} {...props} />
    case 'status.change':
      return <ActivityStatusChange activity={activity} {...props} />
    case 'assignee.add':
      return <ActivityComment activity={activity} entityType={entityType} {...props} />
    case 'assignee.remove':
      return <ActivityComment activity={activity} entityType={entityType} {...props} />

    default:
      return null
  }
}

export default ActivityItem
