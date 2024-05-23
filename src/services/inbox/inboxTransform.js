// return a random folder name

import { compareAsc } from 'date-fns'

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

// get random true or false where there's a 1 in 5 chance of getting true
const getRandomBoolean = () => Math.random() < 0.7

export const transformInboxMessages = (projectEdges = [], isCleared) => {
  const messages = []
  const projectNames = []

  for (const projectEdge of projectEdges) {
    const project = projectEdge.node
    if (!project) continue
    projectNames.push(project.projectName)
    const messageEdges = project.activities?.edges || []

    for (const messageEdge of messageEdges) {
      const message = messageEdge.node

      //   check if the entityId is already in the messages array
      const matchingEntity = messages.find((m) => m.entityId === message.origin?.id)
      const folderName = matchingEntity?.folderName || getRandomFolderName()

      if (!message) continue
      const transformedMessage = {
        ...message,
        folderName: folderName,
        thumbnail: { icon: 'folder' },
        entityId: message.origin?.id,
        entityType: message.origin?.type,
        isRead: true,
        isCleared: getRandomBoolean(),
      }

      // parse fields that are JSON strings
      const jsonFields = ['activityData']

      jsonFields.forEach((field) => {
        if (transformedMessage[field]) {
          try {
            transformedMessage[field] = JSON.parse(transformedMessage[field])
          } catch (e) {
            console.error('Error parsing JSON field', field, transformedMessage[field])
          }
        }
      })

      messages.push(transformedMessage)
    }
  }

  //   filter out messages that are cleared/not-cleared
  const filteredMessages = messages.filter((m) => m.isCleared === isCleared)

  //   now sort the messages by createdAt using the compare function
  const messagesSortedByDate = filteredMessages.sort((a, b) =>
    compareAsc(new Date(a.createdAt), new Date(b.createdAt)),
  )

  //  for the first 5 messages, isRead = false
  for (let i = 0; i < 5; i++) {
    if (messagesSortedByDate[i]) {
      messagesSortedByDate[i].isRead = false
    }
  }

  return { projectNames, messages: messagesSortedByDate }
}
