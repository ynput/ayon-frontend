import PubSub from './pubsub'

/**
 * The expected structure of a websocket message when a thumbnail is updated.
 */
export type ThumbnailUpdateMessage = {
  project: string
  sender?: string
  summary: {
    entityId: string
    entityType: string
    thumbnailHash?: string
  }
}

export type ThumbnailUpdater = (messages: ThumbnailUpdateMessage[]) => void

// Messages are received through the shared SocketProvider websocket and published via PubSub
const THUMBNAIL_TOPIC = 'thumbnail.updated'
let pubSubToken: string | undefined
// Set of active updater objects with their filters
const updaters = new Set<{ updater: ThumbnailUpdater; entityTypes?: string[] }>()

// Queue for lazy batched updates
let messageQueue: ThumbnailUpdateMessage[] = []
let processTimeout: ReturnType<typeof setTimeout> | undefined

const processQueue = () => {
  if (messageQueue.length === 0) return

  // Create a copy of the queue to process
  const queueToProcess = [...messageQueue]
  messageQueue = []

  updaters.forEach(({ updater, entityTypes }) => {
    const filtered = entityTypes
      ? queueToProcess.filter((m) => entityTypes.includes(m.summary.entityType))
      : queueToProcess

    if (filtered.length > 0) {
      updater(filtered)
    }
  })
}

const queueMessage = (message: ThumbnailUpdateMessage) => {
  messageQueue.push(message)

  // Clear previous timeout to implement true debouncing
  if (processTimeout) {
    window.clearTimeout(processTimeout)
  }

  // Jitter/debounce window: Delays processing until 3-4s of silence occurs
  // (Adjust the logic here if you preferred a fixed throttling interval instead)
  const debounceDelay = 3000 + Math.random() * 1000

  processTimeout = window.setTimeout(() => {
    processTimeout = undefined
    processQueue()
  }, debounceDelay)
}

const handleThumbnailMessage = (topic: string, message: ThumbnailUpdateMessage) => {
  if (topic !== THUMBNAIL_TOPIC || !message?.summary) return

  // Bypass debounce if current client initiated the change
  if (message.sender && message.sender === window.senderId) {
    updaters.forEach(({ updater, entityTypes }) => {
      if (!entityTypes || entityTypes.includes(message.summary.entityType)) {
        updater([message])
      }
    })
  } else {
    queueMessage(message)
  }
}

/**
 * Subscribes a callback to listen for thumbnail updates.
 *
 * @param updater Callback to run when a thumbnail update is received.
 * @param entityTypes Optional list of entity types to filter by (e.g., ['folder', 'task']).
 * @returns A cleanup function to unsubscribe from updates.
 */
export const subscribeToThumbnailUpdates = (updater: ThumbnailUpdater, entityTypes?: string[]) => {
  const updaterObj = { updater, entityTypes }
  updaters.add(updaterObj)

  if (!pubSubToken) {
    pubSubToken = PubSub.subscribe(THUMBNAIL_TOPIC, handleThumbnailMessage)
  }

  return () => {
    updaters.delete(updaterObj)

    if (updaters.size === 0) {
      if (processTimeout) {
        window.clearTimeout(processTimeout)
        processTimeout = undefined
        messageQueue = []
      }
      if (pubSubToken) {
        PubSub.unsubscribe(pubSubToken)
        pubSubToken = undefined
      }
    }
  }
}
