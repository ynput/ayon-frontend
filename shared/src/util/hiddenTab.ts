// A hidden tab keeps its websockets connected but holds the messages back until it is visible again,
// so several open AYON tabs don't all patch their caches and refetch for every server event.
// The main socket holds them in createHiddenTabQueue (WebsocketContext), the thumbnail socket in its
// own queue (thumbnailWebsocket.ts).

export const isTabHidden = () =>
  typeof document !== 'undefined' && document.visibilityState === 'hidden'

/**
 * Past this many queued messages (after merging), a hidden tab drops them and refetches the caches
 * they would have patched once it is visible. Replaying costs more by then: handlers fetch changed
 * entities 25 at a time (REALTIME_REST_CALL_LIMIT), so 300 changes can be 12 requests per cache.
 */
export const HIDDEN_TAB_MAX_QUEUED = 300

/**
 * Tag types to invalidate when a hidden tab dropped messages of a topic root: the caches those
 * messages patch. Messages of other topics are never dropped, nothing could refetch for them.
 */
const DROPPED_TOPIC_TAGS: Record<string, string[]> = {
  'entity.folder': [
    'folder',
    'hierarchy',
    'entities',
    'entityListItem',
    'progress',
    'folderColumnStats',
  ],
  'entity.task': [
    'task',
    'overviewTask',
    'kanBanTask',
    'entities',
    'entityListItem',
    'progress',
    'taskColumnStats',
  ],
  'entity.product': ['product', 'entities', 'entityListItem', 'productColumnStats'],
  'entity.version': [
    'version',
    'product',
    'entities',
    'entityListItem',
    'versionColumnStats',
    'review',
    'viewer',
    // version thumbnails in the activity feed, patched by the thumbnail socket
    'entityActivities',
  ],
  'entity.representation': ['entities', 'review', 'viewer'],
  entity_list: ['entityList', 'entityListItem'],
  activity: ['activity', 'entityActivities'],
  link: ['link'],
  reviewable: ['review', 'viewer'],
  // The thumbnail socket delivers thumbnails (thumbnailWebsocket.ts). On this socket only catch-all
  // subscribers get them, so they are dropped first and nothing refetches for them.
  thumbnail: [],
}

/** `entity.version.created` -> `entity.version`, `activity.created` -> `activity` */
export const getTopicRoot = (topic: string) =>
  topic
    .split('.')
    .slice(0, topic.startsWith('entity.') ? 2 : 1)
    .join('.')

// Topic roots dropped while hidden, by either socket. WebsocketContext refetches them on visible.
const droppedTopics = new Set<string>()

/** Marks a topic root's caches for a refetch on visible. False if it isn't listed: keep its messages. */
export const dropHiddenTopic = (root: string) => {
  if (!Object.prototype.hasOwnProperty.call(DROPPED_TOPIC_TAGS, root)) return false
  droppedTopics.add(root)
  return true
}

export const isHiddenTopicDropped = (root: string) => droppedTopics.has(root)

/**
 * Provided by caches that need every message rather than the latest state of each entity (the
 * Events list). A catch-up that merged or dropped messages invalidates it.
 */
export const HIDDEN_TAB_INCOMPLETE_TAG = { type: 'detail', id: 'hidden-tab-incomplete' } as const

/** The tags to invalidate for everything dropped so far, and forgets it. */
export const takeDroppedTopicTags = () => {
  const tags = new Set<string>()
  droppedTopics.forEach((root) => DROPPED_TOPIC_TAGS[root].forEach((tag) => tags.add(tag)))
  droppedTopics.clear()
  return [...tags]
}

/**
 * Messages a hidden tab still hands to its subscribers at once.
 * - `inbox.message`: desktop notifications and their sound are for a user who is in another tab.
 * - Review session changes: a hidden Review tab keeps playing and following the presenter for a while
 *   (ynput/ayon-player#39), and must see its session change to follow Replace version (YN-1311).
 * Review's sync channel is its own socket and is not held back at all.
 */
export const isLiveWhenHidden = (topic: string, data: any) =>
  topic === 'inbox.message' ||
  (topic.startsWith('entity_list.') && data?.summary?.entity_list_type === 'review-session')

type QueuedMessage = { topic: string; data: any }

/**
 * A later message with the same key replaces the earlier one: an entity's repeated change of the same
 * kind, or the status updates of one event. Other messages are kept as they are.
 */
const getMergeKey = (topic: string, data: any): string | undefined => {
  const entityId = data?.summary?.entityId
  if (topic.startsWith('entity.') && entityId) return `${topic}|${data.project}|${entityId}`
  if (data?.id) return `event|${data.id}`
  return undefined
}

/** Holds the main socket's messages while the tab is hidden. */
export const createHiddenTabQueue = () => {
  let queue = new Map<string, QueuedMessage>()
  let unmerged = 0
  let received = 0
  // messages were dropped that no refetch replaces: subscribers get `client.connected` once visible
  let lostUntagged = false

  const overflow = () => {
    queue.forEach((message, key) => {
      if (dropHiddenTopic(getTopicRoot(message.topic))) queue.delete(key)
    })
    // still too long, with topics nothing can refetch for: keep the latest messages
    for (const key of queue.keys()) {
      if (queue.size <= HIDDEN_TAB_MAX_QUEUED) break
      queue.delete(key)
      lostUntagged = true
    }
  }

  return {
    add(topic: string, data: any) {
      received++
      const root = getTopicRoot(topic)
      if (isHiddenTopicDropped(root)) return

      const key = getMergeKey(topic, data) ?? `unmerged|${unmerged++}`
      // re-insert, so a merged message keeps the position of its latest update
      queue.delete(key)
      queue.set(key, { topic, data })

      if (queue.size > HIDDEN_TAB_MAX_QUEUED) overflow()
    },
    /** Everything held since the tab was hidden, and empties the queue. */
    take() {
      // a root either socket dropped is refetched: replaying older messages would roll that back
      const messages = [...queue.values()].filter(
        ({ topic }) => !isHiddenTopicDropped(getTopicRoot(topic)),
      )
      const result = { messages, received, lostUntagged, tags: takeDroppedTopicTags() }
      queue = new Map()
      received = 0
      lostUntagged = false
      return result
    },
  }
}
