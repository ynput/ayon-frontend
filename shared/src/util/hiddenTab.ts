// A hidden tab keeps its websockets connected but holds the messages back until it is visible again,
// so several open AYON tabs don't all patch their caches and refetch for every server event.
// A tab where a video plays holds them back too, until playback stops: the player paints its frames
// on the main thread, and handling a burst of events there drops frames (ayon-frontend#2756).
// The main socket holds them in createHiddenTabQueue (WebsocketContext), the thumbnail socket in its
// own queue (thumbnailWebsocket.ts).

export const isTabHidden = () =>
  typeof document !== 'undefined' && document.visibilityState === 'hidden'

/**
 * The window event a video player sends when it starts and stops playing, with
 * `detail: { id, playing }` (PlaybackEventDetail). A plain DOM event, so an addon needs no new version
 * of this package to send it, and an older web UI ignores it.
 */
export const PLAYBACK_EVENT = 'ayon:playback'
export type PlaybackEventDetail = { id: string; playing: boolean }

// the players playing in this tab
const playingPlayers = new Set<string>()

export const isPlaybackActive = () => playingPlayers.size > 0

/** Whether the sockets hold their messages back: the tab is hidden or a video plays in it. */
export const isHoldingMessages = () => isTabHidden() || isPlaybackActive()

/**
 * After playback stops, the held messages wait this long: a pause paints first, and playing on
 * within it (stepping frames, a seek that restarts playback) skips the catch-up.
 */
export const PLAYBACK_RELEASE_DELAY = 250

const releaseListeners = new Set<() => void>()
let releaseTimer: ReturnType<typeof setTimeout> | undefined

/** Calls `fn` whenever the sockets stop holding messages back. Returns the unsubscribe. */
export const onMessagesReleased = (fn: () => void) => {
  releaseListeners.add(fn)
  return () => {
    releaseListeners.delete(fn)
  }
}

const release = () => {
  clearTimeout(releaseTimer)
  releaseTimer = undefined
  if (!isHoldingMessages()) releaseListeners.forEach((fn) => fn())
}

/** A player started or stopped playing in this tab. The same as sending PLAYBACK_EVENT. */
export const setPlaybackActive = (id: string, playing: boolean) => {
  if (playing) {
    playingPlayers.add(id)
  } else if (playingPlayers.delete(id) && !isHoldingMessages()) {
    releaseTimer ??= setTimeout(release, PLAYBACK_RELEASE_DELAY)
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener(PLAYBACK_EVENT, (event) => {
    const detail = (event as CustomEvent<Partial<PlaybackEventDetail>>).detail
    if (typeof detail?.id === 'string') setPlaybackActive(detail.id, !!detail.playing)
  })
  document.addEventListener('visibilitychange', release)
}

/**
 * Past this many queued messages (after merging), a tab drops them and refetches the caches they
 * would have patched once it stops holding messages back. Replaying costs more by then: handlers fetch changed
 * entities 25 at a time (REALTIME_REST_CALL_LIMIT), so 300 changes can be 12 requests per cache.
 */
export const HIDDEN_TAB_MAX_QUEUED = 300

/**
 * Tag types to invalidate when a tab dropped held messages of a topic root: the caches those
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

// Topic roots dropped while held, by either socket. WebsocketContext refetches them on release.
const droppedTopics = new Set<string>()

/** Marks a topic root's caches for a refetch on release. False if it isn't listed: keep its messages. */
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
 * Messages a tab still hands to its subscribers at once while it holds the others back.
 * - `inbox.message`: desktop notifications and their sound are for a user who is in another tab.
 * - Review session changes: a playing Review tab, or a hidden one that keeps playing and following the
 *   presenter for a while (ynput/ayon-player#39), must see its session change, to follow Replace
 *   version (YN-1311) and clips added or removed.
 * Review's sync channel is its own socket and is not held back at all.
 */
export const isLiveWhenHeld = (topic: string, data: any) =>
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

/** Holds the main socket's messages while the tab is hidden or a video plays. */
export const createHiddenTabQueue = () => {
  let queue = new Map<string, QueuedMessage>()
  let unmerged = 0
  let received = 0
  // messages were dropped that no refetch replaces: subscribers get `client.connected` on release
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
    /** Everything held so far, and empties the queue. */
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
