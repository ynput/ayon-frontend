import * as Styled from './ActivityAssigneeChange.styled'
import ActivityDate from '../ActivityDate'

const ActivityAssigneeChange = ({ activity = {}, isAdding }) => {
  const { authorFullName, createdAt, activityData = {} } = activity
  const { assignee } = activityData

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
