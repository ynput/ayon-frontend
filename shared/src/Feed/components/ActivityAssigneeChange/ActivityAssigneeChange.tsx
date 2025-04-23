import React from 'react'
import * as Styled from './ActivityAssigneeChange.styled'
import ActivityDate from '../ActivityDate'

interface ActivityData {
  assignee: string
}

export interface ActivityAssigneeChangeProps {
  activity: {
    authorFullName?: string
    createdAt?: string
    activityData?: ActivityData
    [key: string]: any
  }
  isAdding?: boolean
}

const ActivityAssigneeChange: React.FC<ActivityAssigneeChangeProps> = ({ activity, isAdding }) => {
  const { authorFullName, createdAt, activityData } = activity || {}
  const { assignee } = activityData || {}

  let fullText = authorFullName
  fullText += isAdding ? ' added ' : ' removed '
  fullText += 'assignee: ' + assignee

  return (
    <Styled.StatusChange>
      <Styled.Body>
        <Styled.Text>{fullText}</Styled.Text>
        <ActivityDate date={createdAt} />
      </Styled.Body>
    </Styled.StatusChange>
  )
}

export default ActivityAssigneeChange
