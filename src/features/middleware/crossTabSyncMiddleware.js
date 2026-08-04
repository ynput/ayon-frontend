// Cross-tab cache sync (YN-0914)
//
// Each browser tab runs its own Redux store with its own RTK Query cache and
// its own WebSocket connection. Server events DO reach every tab, but the
// cache mutations triggered locally - optimistic patches dispatched by
// `updateQueryData`/`updateCachedData` and tag invalidations (both explicit
// `invalidateTags()` calls and the automatic invalidation that runs when a
// mutation settles) - are local to the tab that performed the change. This
// makes the other tabs keep serving stale cache data until their own WS event
// arrives (or never, when the operation emits no event the realtime handler
// subscribes to).
//
// This middleware relays those cache-mutating internal actions between tabs
// through a BroadcastChannel. When a tab receives an action from another tab,
// it re-dispatches it locally, so RTK Query applies the same optimistic patch
// or invalidation in every open tab.
//
// Loop protection: every relayed action is re-dispatched with the
// RELAY_MARKER meta flag, and actions carrying that flag are never re-broadcast.
//
// Why relaying optimistic patches is safe here:
//  - Creating an entity list (the case from YN-0914) never dispatches an
//    optimistic queryResultPatched - it only invalidates tags, so the relayed
//    invalidation makes the other tab refetch (always safe).
//  - In-place edits use Object.assign-style patches, which are idempotent if
//    applied twice (relayed patch + the tab's own WS realtime update).
//  - The realtime handlers debounce by up to 10s (createBatchedCacheUpdater in
//    getLists.ts), so without this relay the other tab would serve stale data
//    for seconds after the mutation settles.
//  - RTK Query only applies queryResultPatched to cache entries that already
//    exist (updateQuerySubstateIfExists), so a tab that never loaded the query
//    is a no-op.

const CHANNEL_NAME = 'ayon-cross-tab-cache-sync'
const RELAY_MARKER = '__ayonCrossTabRelay'

// Suffixes of the RTK Query internal actions that mutate the shared cache.
// They are matched by suffix so future API slices are covered automatically:
//  - /queries/queryResultPatched  optimistic patches (updateQueryData/updateCachedData)
//  - /invalidateTags              explicit tag invalidations
//  - /executeMutation/fulfilled   settled mutations -> automatic invalidation
//  - /executeMutation/rejected    settled mutations -> automatic invalidation
const CACHE_MUTATION_ACTION_TYPES = [
  '/queries/queryResultPatched',
  '/invalidateTags',
  '/executeMutation/fulfilled',
  '/executeMutation/rejected',
]

const isCacheMutationAction = (type) =>
  CACHE_MUTATION_ACTION_TYPES.some((suffix) => type.endsWith(suffix))

const crossTabSyncMiddleware = () => {
  // Identity of this tab. Read lazily because `window.senderId` is assigned in
  // index.tsx AFTER the store module evaluates.
  let tabId = null
  const getTabId = () => {
    if (tabId) return tabId
    tabId =
      (typeof window !== 'undefined' && window.senderId) ||
      `tab-${Math.random().toString(36).slice(2)}`
    return tabId
  }

  let channel = null
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel(CHANNEL_NAME)
    }
  } catch (error) {
    console.warn('[cross-tab] BroadcastChannel unavailable, cache sync disabled', error)
  }

  return (store) => {
    if (channel) {
      channel.onmessage = (event) => {
        const message = event.data
        if (!message || !message.action) return
        if (message.tabId === getTabId()) return // ignore our own broadcasts

        const { type, payload, meta } = message.action
        if (typeof type !== 'string') return

        // Re-dispatch locally. The RELAY_MARKER prevents this tab from
        // re-broadcasting the same action back to the others.
        store.dispatch({ type, payload, meta: { ...(meta || {}), [RELAY_MARKER]: true } })
      }
    }

    return (next) => (action) => {
      const result = next(action)

      if (
        channel &&
        typeof action?.type === 'string' &&
        isCacheMutationAction(action.type) &&
        !action.meta?.[RELAY_MARKER]
      ) {
        try {
          channel.postMessage({
            tabId: getTabId(),
            action: { type: action.type, payload: action.payload, meta: action.meta },
          })
        } catch (error) {
          console.warn('[cross-tab] failed to relay cache update', error)
        }
      }

      return result
    }
  }
}

export default crossTabSyncMiddleware
