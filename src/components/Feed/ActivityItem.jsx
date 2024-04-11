import React from 'react'
import ActivityComment from './ActivityComment'

const ActivityItem = ({ users, activity, entityType, ...props }) => {
  switch (activity.activityType) {
    case 'comment':
      return (
        <ActivityComment activity={activity} users={users} entityType={entityType} {...props} />
      )
    case 'status.change':
      return (
        <ActivityComment activity={activity} users={users} entityType={entityType} {...props} />
      )
    case 'assignee.add':
      return (
        <ActivityComment activity={activity} users={users} entityType={entityType} {...props} />
      )
    case 'assignee.remove':
      return (
        <ActivityComment activity={activity} users={users} entityType={entityType} {...props} />
      )

    default:
      return null
  }
}

export default ActivityItem
