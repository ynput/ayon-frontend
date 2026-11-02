import { GetInboxMessagesQuery, GetInboxMessagesQueryVariables } from '@shared/api'

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

// the inbox resolver truncates in SQL, the activities resolver does not
const BODY_LIMIT = 200

const truncateBody = (body: string): string =>
  body.length > BODY_LIMIT ? `${body.slice(0, BODY_LIMIT).replace(/\n/g, ' ')}...` : body

export const transformInboxMessages = (
  inbox: GetInboxMessagesQuery['inbox'],
  { important = false }: GetInboxMessagesQueryVariables | void = {},
  { truncate = false }: { truncate?: boolean } = {},
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
      body: truncate ? truncateBody(message.body) : message.body,
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

export const EMPTY_INBOX_PAGE: TransformedInboxMessages = {
  messages: [],
  projectNames: [],
  pageInfo: { hasPreviousPage: false, startCursor: null, endCursor: null },
}

export type InboxPagesDraft = { pages: { messages: InboxMessage[] }[] }

// realtime rows always belong at the top, and only ones no page holds yet
export const unshiftNewMessages = (draft: InboxPagesDraft, messages: InboxMessage[]): void => {
  if (!draft?.pages?.length) return

  const cachedIds = new Set<string>()
  draft.pages.forEach((page) => page.messages.forEach((m) => cachedIds.add(m.referenceId)))

  const newMessages = messages.filter((m) => !cachedIds.has(m.referenceId))
  if (newMessages.length) draft.pages[0].messages.unshift(...newMessages)
}
