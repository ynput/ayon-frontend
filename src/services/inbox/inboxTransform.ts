import { GetInboxMessagesQuery, GetInboxMessagesQueryVariables } from '@api/graphql'

type MessageNode = GetInboxMessagesQuery['inbox']['edges'][0]['node']
export interface InboxMessage extends MessageNode {
  folderName: string
  thumbnail: { icon: string }
  entityId: string | null | undefined
  entityType: string | null | undefined
  important: boolean
  path: string[]
}

export interface TransformedInboxMessages {
  messages: InboxMessage[]
  projectNames: string[]
  pageInfo: GetInboxMessagesQuery['inbox']['pageInfo']
}
;[]

export const transformInboxMessages = (
  inbox: GetInboxMessagesQuery['inbox'],
  { important = false }: GetInboxMessagesQueryVariables | void = {},
): TransformedInboxMessages => {
  const messages: InboxMessage[] = []
  const projectNames: string[] = []
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
      important: !!important,
      path: path,
    }

    type JsonFields = keyof MessageNode

    const jsonFields: JsonFields[] = ['activityData']

    jsonFields.forEach((field) => {
      if (message[field]) {
        try {
          // @ts-ignore
          transformedMessage[field] = JSON.parse(transformedMessage[field]) as any
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
