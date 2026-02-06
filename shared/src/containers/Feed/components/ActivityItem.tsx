import React from 'react'
import ActivityComment from './ActivityComment/ActivityComment'
import ActivityStatusChange from './ActivityStatusChange/ActivityStatusChange'
import ActivityAssigneeChange from './ActivityAssigneeChange/ActivityAssigneeChange'
import ActivityVersions from './ActivityVersions/ActivityVersions'
import ActivityGroup from './ActivityGroup/ActivityGroup'
import { Status } from '../../ProjectTreeTable/types/project'

interface ActivityItemProps {
  activity: {
    activityType: string
    items?: any[]
    [key: string]: any
    authorName: string
  }
  fromGroup?: boolean
  projectInfo: Record<string, any>
  createdAts?: string[]
  editProps?: Record<string, any>
  filter: any
  readOnly: boolean
  statuses: Status[]
  projectName: string
  entityType: string
  isSlideOut?: boolean
  onReferenceClick?: (arg: any) => void
  onFileExpand?: (arg: any) => void
  showOrigin?: boolean
  isHighlighted?: boolean
  onCheckChange?: (e: React.ChangeEvent<HTMLInputElement>, activity: any) => void
  onDelete?: (activityId: string, entityId: string, refs: any) => Promise<void>
  onUpdate?: (value: any, files: any, refs?: any, data?: any) => Promise<void>
}

const ActivityItem: React.FC<ActivityItemProps> = ({
  activity,
  fromGroup,
  projectInfo,
  createdAts,
  editProps,
  filter,
  readOnly,
  statuses,
  isSlideOut,
  ...props
}) => {
  switch (activity.activityType) {
    case 'comment':
      return (
        // @ts-expect-error
        <ActivityComment
          {...{ activity, projectInfo, editProps, readOnly, statuses, isSlideOut }}
          {...props}
        />
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
        !fromGroup && (
          <ActivityGroup editProps={editProps} activities={activity.items || []} {...props} />
        )
      )
    default:
      return null
  }
}

export default ActivityItem
