import React from 'react'
import * as Styled from './ActivityStatusChange.styled'
import ActivityDate from '../ActivityDate'
import { Icon } from '@ynput/ayon-react-components'
import useGetContextParents from './hooks/getContextParents'

interface StatusInfo {
  icon?: string
  color?: string
  name?: string
}

interface ActivityStatusChangeProps {
  entityType?: string
  activity: {
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
  const { authorFullName, createdAt, oldStatus = {}, newStatus = {} } = activity
  const tagList = useGetContextParents(activity, entityType)

  return (
    <Styled.StatusChange>
      <Styled.Body>
        <Styled.Text>{authorFullName}</Styled.Text>
        <Styled.Text>- {tagList.join(' / ')} -</Styled.Text>
        {oldStatus.icon && <Icon icon={oldStatus.icon} style={{ color: oldStatus.color }} />}
        <Styled.Text>{oldStatus.name}</Styled.Text>
        <Icon icon="trending_flat" />
        {newStatus.icon && <Icon icon={newStatus.icon} style={{ color: newStatus.color }} />}
        <Styled.Text>{newStatus.name}</Styled.Text>
      </Styled.Body>
      <ActivityDate date={createdAt} />
    </Styled.StatusChange>
  )
}

export default ActivityStatusChange
