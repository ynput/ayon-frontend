import { useGetActivitiesQuery } from '/src/services/activities/getActivities'
import { filterActivityTypes } from '/src/features/dashboard'
import InboxMessage from '../InboxMessage/InboxMessage'
import * as Styled from './Inbox.styled'
import { useMemo, useState } from 'react'

// return a random folder name
// different types, epi: ep{number}sq{number}sh{number}, shot: sh{number}, feat: sh{0000number}, asset: {asset_name}
const assetsNames = [
  'car',
  'house',
  'tree',
  'dog',
  'cat',
  'bird',
  'fish',
  'flower',
  'rock',
  'mountain',
  'river',
  'lake',
  'ocean',
  'sky',
  'cloud',
  'sun',
  'moon',
  'star',
  'planet',
  'galaxy',
  'universe',
]
const types = ['epi', 'shot', 'feat', 'asset']

const getRandomNumber = (interval = 10, max = 100) =>
  Math.floor(Math.random() * (max / interval) + 1) * interval

const getRandomFolderName = () => {
  const type = types[Math.floor(Math.random() * types.length)]

  switch (type) {
    case 'epi':
      return `ep${getRandomNumber(10, 200)}sq${getRandomNumber()}sh${getRandomNumber()}`
    case 'shot':
      return `sh${getRandomNumber()}`
    case 'feat':
      return `sh000${getRandomNumber()}`
    case 'asset':
      return assetsNames[Math.floor(Math.random() * assetsNames.length)]
    default:
      return ''
  }
}

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

  const transformedMessages = useMemo(
    () =>
      messages.map((m, i) => ({
        ...m,
        folderName: getRandomFolderName(),
        thumbnail: { icon: 'folder' },
        isRead: i > 5,
      })),
    [messages],
  )

  // single select only allow but multi select is possible
  // it always seems to become multi select so i'll just support it from the start
  const [selected, setSelected] = useState([])

  const handleMessageSelect = (id) => {
    // if the message is already selected, deselect it
    if (selected.includes(id)) {
      setSelected(selected.filter((s) => s !== id))
      return
    } else {
      setSelected([id])
    }
  }

  const handClearMessage = (id) => {
    console.log('clearing message', id)
    // deselect the message
    setSelected(selected.filter((s) => s !== id))
  }

  return (
    <Styled.InboxSection direction="row">
      <Styled.MessagesList>
        {transformedMessages.map((message) => (
          <InboxMessage
            key={message.activityId}
            title={message.folderName}
            subTitle={message.origin?.label || message.origin?.name}
            type={message.activityType}
            body={message.body}
            createdAt={message.createdAt}
            userName={message.authorName}
            isRead={message.isRead}
            onClick={() => handleMessageSelect(message.activityId)}
            isSelected={selected.includes(message.activityId)}
            onClear={() => handClearMessage(message.activityId)}
          />
        ))}
      </Styled.MessagesList>
      {/* <div>Panel</div> */}
    </Styled.InboxSection>
  )
}

export default Inbox
