import * as Styled from './ActivityStatusChange.styled'
import ActivityDate from '../ActivityDate'
import { Icon } from '@ynput/ayon-react-components'

const ActivityStatusChange = ({ activity = {} }) => {
  const { authorFullName, createdAt, oldStatus = {}, newStatus = {} } = activity

  return (
    <Styled.StatusChange>
      <Styled.Body>
        <Styled.Text>{authorFullName}</Styled.Text>
        <Styled.Text>changed status</Styled.Text>
        {newStatus.icon && <Icon icon={oldStatus.icon} style={{ color: oldStatus.color }} />}
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
