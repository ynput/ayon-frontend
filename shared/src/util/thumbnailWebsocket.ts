import { dropHiddenTopic, HIDDEN_TAB_MAX_QUEUED, isHiddenTopicDropped, isTabHidden } from './hiddenTab'

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

// Queue for lazy batched updates, one message per entity: a newer thumbnail replaces an older one
let messageQueue = new Map<string, ThumbnailUpdateMessage>()
let processTimeout: number | undefined

const processQueue = () => {
  if (messageQueue.size === 0) return

  // Create a copy of the queue to process
  const queueToProcess = [...messageQueue.values()]
  messageQueue = new Map()

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
  const { entityType, entityId } = message.summary
  if (isTabHidden() && isHiddenTopicDropped(`entity.${entityType}`)) return
  messageQueue.set(`${message.project}|${entityType}|${entityId}`, message)

  // A hidden tab processes the queue once it is visible (hiddenTab.ts). If the queue grows too long,
  // it is dropped and the caches of those entity types refetch instead.
  if (isTabHidden()) {
    if (messageQueue.size > HIDDEN_TAB_MAX_QUEUED) {
      messageQueue.forEach((m, key) => {
        if (dropHiddenTopic(`entity.${m.summary.entityType}`)) messageQueue.delete(key)
      })
      // still too long, with entity types nothing refetches for: those thumbnails stay stale
      if (messageQueue.size > HIDDEN_TAB_MAX_QUEUED) messageQueue = new Map()
    }
    return
  }

  // A batch is already scheduled, it will pick up this message too.
  // Do not reschedule it, otherwise a steady stream of updates would postpone it forever.
  if (processTimeout) return

  // Jitter/throttle window: processes the batch 3-4s after its first message
  const throttleDelay = 3000 + Math.random() * 1000

  processTimeout = window.setTimeout(() => {
    processTimeout = undefined
    // hidden in the meantime: wait for the tab to be visible
    if (!isTabHidden()) processQueue()
  }, throttleDelay)
}

const onVisibilityChange = () => {
  if (isTabHidden()) return
  window.clearTimeout(processTimeout)
  processTimeout = undefined
  processQueue()
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
        if (message.sender && message.sender === (window as any).senderId && !isTabHidden()) {
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
    document.addEventListener('visibilitychange', onVisibilityChange)
  }

  return () => {
    updaters.delete(updaterObj)

    if (updaters.size === 0) {
      if (reconnectTimeout) {
        window.clearTimeout(reconnectTimeout)
        reconnectTimeout = undefined
      }
      document.removeEventListener('visibilitychange', onVisibilityChange)
      if (processTimeout) {
        window.clearTimeout(processTimeout)
        processTimeout = undefined
      }
      messageQueue = new Map()
      if (ws) {
        ws.onclose = null // Prevent reconnect loop on intentional disconnect
        ws.close()
        ws = null
      }
    }
  }
}
