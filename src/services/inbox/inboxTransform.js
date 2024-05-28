// return a random folder name
import { compareAsc } from 'date-fns'

export const transformInboxMessages = (messageEdges = [], { important = false, active = true }) => {
  const messages = []
  const projectNames = []

  for (const messageEdge of messageEdges) {
    const message = messageEdge.node

    if (!message) continue

    const transformedMessage = {
      ...message,
      folderName: '',
      thumbnail: { icon: 'folder' },
      entityId: message.origin?.id,
      entityType: message.origin?.type,
      important: important,
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

    // extract project and add to projectNames if not already there
    if (message.projectName && !projectNames.includes(message.projectName)) {
      projectNames.push(message.projectName)
    }
  }

  //   now sort the messages by createdAt using the compare function
  const messagesSortedByDate = messages.sort((a, b) =>
    active ? compareAsc(new Date(b.createdAt), new Date(a.createdAt)) : messages,
  )

  return { projectNames, messages: messagesSortedByDate }
}
