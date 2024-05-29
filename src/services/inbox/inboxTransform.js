export const transformInboxMessages = (inbox = {}, { important = false }) => {
  const messages = []
  const projectNames = []
  const messageEdges = inbox.edges || []

  for (const messageEdge of messageEdges) {
    const message = messageEdge.node

    if (!message) continue

    const entityType = message.origin?.type

    const path = [...(message.parents || []), message.origin]
      .map((p) => p?.label || p?.name || 'Unknown')
      .filter(Boolean)

    const transformedMessage = {
      ...message,
      folderName: '',
      thumbnail: { icon: 'folder' },
      entityId: message.origin?.id,
      entityType: entityType,
      important: important,
      path: path,
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

  return { projectNames, messages, pageInfo: inbox.pageInfo }
}
