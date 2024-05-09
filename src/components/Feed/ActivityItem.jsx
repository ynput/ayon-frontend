import React from 'react'
import ActivityComment from './ActivityComment/ActivityComment'
import ActivityStatusChange from './ActivityStatusChange/ActivityStatusChange'
import ActivityAssigneeChange from './ActivityAssigneeChange/ActivityAssigneeChange'
import ActivityGroup from './ActivityGroup/ActivityGroup'
import styled from 'styled-components'
import { format } from 'date-fns'
import { isValid } from 'date-fns'

const FeedEnd = styled.div`
  padding: 0 10px;
  color: var(--md-sys-color-outline);
  font-size: 12px;
`

const ActivityItem = ({
  activity = {},
  fromGroup,
  projectInfo = {},
  createdAts = [],
  editProps,
  ...props
}) => {
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
    case 'end':
      return (
        <FeedEnd>{`Task${createdAts.length > 1 ? 's' : ''} created: ${createdAts
          .map((c) =>
            isValid(new Date(c)) ? format(new Date(c), 'do MMMM y, H:mm') : 'At some point...',
          )
          .join(', ')}`}</FeedEnd>
      )
    default:
      return null
  }
}

export default ActivityItem
