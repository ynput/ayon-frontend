import { foldersApi } from '@shared/api/generated'
import { api as eventsApi } from '@shared/api/generated/events'
import { PubSub } from '@shared/util'

const enhancedApi = foldersApi.enhanceEndpoints({
  endpoints: {
    getFolderHierarchy: {
      providesTags: ['hierarchy'],
    },
    getFolderList: {
      providesTags: (result, _e, { projectName }) => [
        'hierarchy',
        { type: 'folder', id: 'LIST' },
        ...(result?.folders.map(({ id }) => ({ type: 'folder', id })) || []),
        { type: 'folder', id: projectName },
      ],
      async onCacheEntryAdded(
        args,
        { cacheDataLoaded, cacheEntryRemoved, updateCachedData, dispatch },
      ) {
        const { projectName } = args || {}
        const topics = ['entity.folder', 'entity.folder.created', 'entity.folder.deleted']
        const tokens: (string | undefined)[] = []

        // Simplified trailing throttle approach:
        // - Collect updated folder IDs for 1000ms window
        // - If a creation topic appears, perform one full list refetch (within throttle window)
        // - Otherwise, fetch each pending event and patch existing cache entries only
        const MIN_INTERVAL = 1000
        const pendingEventIds = new Set<string>()
        let resyncFlag = false // full list refetch needed (created or deleted)
        let timer: ReturnType<typeof setTimeout> | null = null
        let processing = false

        const clearTimer = () => {
          if (timer) {
            clearTimeout(timer)
            timer = null
          }
        }

        const schedule = () => {
          if (!timer) {
            timer = setTimeout(run, MIN_INTERVAL)
          }
        }

        // All non-created/deleted events are treated as incremental updates.
        const run = async () => {
          clearTimer()
          if (processing || !projectName) return
          processing = true
          try {
            if (resyncFlag) {
              resyncFlag = false
              try {
                // get full folder list and update cache - done for created events
                const result = await dispatch(
                  foldersApi.endpoints.getFolderList.initiate(
                    // @ts-expect-error realtime flag to avoid toggling global isFetching for watchers
                    { ...args, realtime: true },
                    { forceRefetch: true },
                  ),
                ).unwrap()
                updateCachedData(() => result)
              } catch {
                /* ignore */
                console.warn('Failed to refetch folder list on resync')
              } finally {
                pendingEventIds.clear()
              }
              return
            }

            if (pendingEventIds.size === 0) return
            const eventIds = Array.from(pendingEventIds)
            pendingEventIds.clear()
            type Patch = {
              folderId: string
              partial?: Record<string, any>
              attribMerge?: Record<string, any>
              updatedAt?: string
            }
            const patches: Patch[] = []
            const topicFieldMap: Record<string, string> = {
              'entity.folder.label_changed': 'label',
              'entity.folder.renamed': 'name',
              'entity.folder.type_changed': 'folderType',
              'entity.folder.status_changed': 'status',
              'entity.folder.tags_changed': 'tags',
              'entity.folder.attrib_changed': 'attrib',
            }
            await Promise.all(
              eventIds.map(async (eventId) => {
                try {
                  // Fetch each event and apply incremental updates
                  const event = await dispatch(
                    eventsApi.endpoints.getEvent.initiate({ eventId }, { forceRefetch: true }),
                  ).unwrap()
                  const topic: string = event?.topic || ''
                  const payload: any = event?.payload || {}
                  const summary: any = event?.summary || {}
                  const folderId: string | undefined = summary.entityId
                  if (!folderId) return
                  const fieldName = topicFieldMap[topic]
                  if (!fieldName) return
                  if (
                    fieldName === 'attrib' &&
                    payload?.newValue &&
                    typeof payload.newValue === 'object'
                  ) {
                    patches.push({
                      folderId,
                      attribMerge: payload.newValue,
                      updatedAt: event.updatedAt,
                    })
                  } else {
                    const value = payload?.newValue
                    if (value === undefined) return
                    const partial: Record<string, any> = { updatedAt: event.updatedAt }
                    partial[fieldName] = value
                    // parentId might accompany some changes in summary
                    if (summary.parentId !== undefined) partial.parentId = summary.parentId
                    patches.push({ folderId, partial })
                  }
                } catch {
                  /* ignore single event errors */
                }
              }),
            )
            if (!patches.length) return
            updateCachedData((draft: any) => {
              if (!draft || !Array.isArray(draft.folders)) return
              patches.forEach((patch) => {
                const idx = draft.folders.findIndex((f: any) => f.id === patch.folderId)
                // if folder not found, skip
                if (idx === -1) return
                // apply patch to existing folder
                if (patch.attribMerge) {
                  // merge attribs if attribMerge is provided
                  draft.folders[idx].attrib = {
                    ...(draft.folders[idx].attrib || {}),
                    ...patch.attribMerge,
                  }
                  // update updatedAt if provided
                  if (patch.updatedAt) draft.folders[idx].updatedAt = patch.updatedAt
                }
                if (patch.partial) {
                  // apply partial update
                  draft.folders[idx] = { ...draft.folders[idx], ...patch.partial }
                }
              })
            })
          } finally {
            processing = false
          }
        }

        try {
          await cacheDataLoaded

          const handlePubSub = (_topic: string, _message: any) => {
            if (_topic.endsWith('.created') || _topic.endsWith('.deleted')) {
              resyncFlag = true
              schedule()
              return
            }
            const eventId = _message?.id
            if (eventId) {
              pendingEventIds.add(eventId)
              schedule()
            }
          }

          topics.forEach((t) => tokens.push(PubSub.subscribe(t, handlePubSub)))
        } catch {
          // silent
        }

        await cacheEntryRemoved
        tokens.forEach((t) => PubSub.unsubscribe(t))
        clearTimer()
      },
    },
  },
})

export const { useGetFolderHierarchyQuery, useGetFolderListQuery } = enhancedApi
export { enhancedApi as foldersQueries }
