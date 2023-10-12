import React from 'react'
import FeedComment from './FeedComment/FeedComment'

const FeedItem = ({ users, ...event }) => {
  switch (event.eventType) {
    case 'comment':
      return <FeedComment comment={event} users={users} />

    default:
      return null
  }
}

export default FeedItem
