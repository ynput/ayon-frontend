import React from 'react'
import ActivityComment from './ActivityComment/ActivityComment'
import ActivityStatusChange from './ActivityStatusChange/ActivityStatusChange'
import ActivityAssigneeChange from './ActivityAssigneeChange/ActivityAssigneeChange'
import ActivityGroup from './ActivityGroup/ActivityGroup'
import styled from 'styled-components'
import ActivityVersions from './ActivityVersions/ActivityVersions'
import ActivityDate from './ActivityDate'

const FeedEnd = styled.div`
  padding: 0 10px;
  color: var(--md-sys-color-outline);
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  user-select: none;
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
    case 'version.publish':
      return <ActivityVersions {...{ activity, projectInfo }} {...props} />
    case 'group':
      // fromGroup prevents infinite recursion
      return !fromGroup && <ActivityGroup activities={activity.items} {...props} />
    case 'end':
      return (
        <FeedEnd>
          <>
            {`Task${createdAts.length > 1 ? 's' : ''} created:`}
            {createdAts.map((c, i) => (
              <ActivityDate date={c} key={i} style={{ margin: 0 }} />
            ))}
          </>
        </FeedEnd>
      )
    default:
      return null
  }
}

export default ActivityItem
