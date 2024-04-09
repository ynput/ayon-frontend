import React from 'react'
import ActivityComment from './ActivityComment/ActivityComment'

const ActivityItem = ({ users, ...activity }) => {
  switch (activity.activityType) {
    case 'comment':
      return <ActivityComment comment={activity} users={users} />

    default:
      return null
  }
}

export default ActivityItem
