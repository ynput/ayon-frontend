import React from 'react'
import ActivityComment from './ActivityComment/ActivityComment'
import ActivityStatusChange from './ActivityStatusChange/ActivityStatusChange'
import ActivityAssigneeChange from './ActivityAssigneeChange/ActivityAssigneeChange'
import ActivityGroup from './ActivityGroup/ActivityGroup'
import styled from 'styled-components'
import ActivityVersions from './ActivityVersions/ActivityVersions'
import ActivityDate from './ActivityDate'
import { upperFirst } from 'lodash'

const FeedEnd = styled.div`
  padding: 0 10px;
  color: var(--md-sys-color-outline);
  font-size: 12px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--base-gap-small);
  user-select: none;
  overflow: hidden;
  white-space: nowrap;
`

const ActivityItem = ({
  activity = {},
  fromGroup,
  projectInfo = {},
  createdAts = [],
  editProps,
  filter,
  readOnly,
  statuses = [],
  ...props
}) => {
  switch (activity.activityType) {
    case 'comment':
      return (
        <ActivityComment {...{ activity, projectInfo, editProps, readOnly, statuses }} {...props} />
      )
    case 'status.change':
      return <ActivityStatusChange activity={activity} {...props} />
    case 'assignee.add':
      return <ActivityAssigneeChange activity={activity} {...props} isAdding />
    case 'assignee.remove':
      return <ActivityAssigneeChange activity={activity} {...props} />
    case 'version.publish':
      return <ActivityVersions {...{ activity, projectInfo, filter }} {...props} />
    case 'group':
      // fromGroup prevents infinite recursion
      return (
        !fromGroup && <ActivityGroup editProps={editProps} activities={activity.items} {...props} />
      )
    default:
      return null
  }
}

export default ActivityItem
