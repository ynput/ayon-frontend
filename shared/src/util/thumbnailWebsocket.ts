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

// Singleton WebSocket instance
let ws: WebSocket | null = null
// Set of active updater objects with their filters
const updaters = new Set<{ updater: ThumbnailUpdater; entityTypes?: string[] }>()
let reconnectTimeout: ReturnType<typeof setTimeout> | undefined

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

/**
 * Initializes the WebSocket connection and sets up event listeners.
 */
const connectWS = () => {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    return
  }

  const proto = window.location.protocol.replace('http', 'ws')
  const wsAddress = `${proto}//${window.location.host}/ws`

  ws = new WebSocket(wsAddress)

  ws.onopen = () => {
    const accessToken = localStorage.getItem('accessToken')
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          topic: 'auth',
          token: accessToken,
          subscribe: ['thumbnail.updated'],
        }),
      )
    }
  }

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)

      // Note: Ensure your server data structure matches this check.
      // If the server wraps the message in a 'payload' property, adjust accordingly.
      if (data.topic === 'thumbnail.updated') {
        const message = data as ThumbnailUpdateMessage

        // Bypass debounce if current client initiated the change
        if (message.sender && message.sender === (window as any).senderId) {
          updaters.forEach(({ updater, entityTypes }) => {
            if (!entityTypes || entityTypes.includes(message.summary.entityType)) {
              updater([message])
            }
          })
        } else {
          queueMessage(message)
        }
      }
    } catch (error) {
      console.error('Failed to parse thumbnail update websocket message', error)
    }
  }

  ws.onclose = () => {
    ws = null
    // Auto-reconnect after 5 seconds if there are still active subscribers
    if (updaters.size > 0) {
      reconnectTimeout = window.setTimeout(() => connectWS(), 5000)
    }
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

  if (updaters.size === 1) {
    connectWS()
  }

  return () => {
    updaters.delete(updaterObj)

    if (updaters.size === 0) {
      if (reconnectTimeout) {
        window.clearTimeout(reconnectTimeout)
        reconnectTimeout = undefined
      }
      if (processTimeout) {
        window.clearTimeout(processTimeout)
        processTimeout = undefined
        messageQueue = []
      }
      if (ws) {
        ws.onclose = null // Prevent reconnect loop on intentional disconnect
        ws.close()
        ws = null
      }
    }
  }
}
