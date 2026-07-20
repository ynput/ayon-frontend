import React from 'react'
import * as Styled from './ActivityStatusChange.styled'
import ActivityDate from '../ActivityDate'
import { Icon } from '@ynput/ayon-react-components'
import useGetContextParents from './hooks/getContextParents'
import { ActivityStatusSecondary } from './ActivityStatusSecondary'

interface StatusInfo {
  icon?: string
  color?: string
  name?: string
}

interface ActivityStatusChangeProps {
  entityType?: string
  activity: {
    authorName?: string
    authorFullName?: string
    createdAt?: string
    oldStatus?: StatusInfo
    newStatus?: StatusInfo
    [key: string]: any
  }
}

const ActivityStatusChange: React.FC<ActivityStatusChangeProps> = ({
  entityType,
  activity = {},
}) => {
  const { authorName, authorFullName, createdAt, oldStatus = {}, newStatus = {} } = activity
  const tagList = useGetContextParents(activity, entityType)

  return (
    <Styled.StatusChange>
      <Styled.Body>
        <Styled.Text>{authorFullName || authorName}</Styled.Text>
        <Styled.Text>- {tagList.join(' / ')} -</Styled.Text>
        <ActivityStatusSecondary
          icon={oldStatus.icon}
          color={oldStatus.color}
          name={oldStatus.name || ''}
        />
        <Icon icon="trending_flat" />
        <ActivityStatusSecondary
          icon={newStatus.icon}
          color={newStatus.color}
          name={newStatus.name || ''}
        />
      </Styled.Body>
      <ActivityDate date={createdAt} />
    </Styled.StatusChange>
  )
}

export default ActivityStatusChange
