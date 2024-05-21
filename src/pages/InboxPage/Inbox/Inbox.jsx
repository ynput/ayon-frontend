import { useGetActivitiesQuery } from '/src/services/activities/getActivities'
import { filterActivityTypes } from '/src/features/dashboard'
import InboxMessage from '../InboxMessage/InboxMessage'
import * as Styled from './Inbox.styled'
import { useState } from 'react'

const Inbox = ({ filter }) => {
  // TODO: get inbox endpoint instead of activities
  const projectName = 'demo_Commercial'
  const folderId = '7dcc7f6cfcc811eeaf820242c0a80002',
    taskId = '7dceece8fcc811eeaf820242c0a80002',
    versionId = '7dcdf1eefcc811eeaf820242c0a80002'
  const entityIds = [folderId, taskId, versionId]
  const activityTypes = filterActivityTypes.activity
  const { data: messages = [] } = useGetActivitiesQuery({
    projectName,
    entityIds,
    activityTypes,
    referenceTypes: ['origin', 'mention', 'relation'],
    last: 30,
    cursor: null,
  })

  // single select only allow but multi select is possible
  // it always seems to become multi select so i'll just support it from the start
  const [selected, setSelected] = useState([])

  return (
    <Styled.InboxSection direction="row">
      <Styled.MessagesList>
        {messages.map((message) => (
          <InboxMessage
            key={message.activityId}
            title={message.origin?.label || message.origin?.name}
            onClick={() => setSelected([message.activityId])}
            isSelected={selected.includes(message.activityId)}
          />
        ))}
      </Styled.MessagesList>
      <div>Panel</div>
    </Styled.InboxSection>
  )
}

export default Inbox
