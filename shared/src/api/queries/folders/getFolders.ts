import { foldersApi } from '@shared/api/generated'
import { api as eventsApi } from '@shared/api/generated/events'
import { PubSub, subscribeToThumbnailUpdates, ThumbnailUpdateMessage } from '@shared/util'

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
        const patchFields = (args as any)?.patch as string[] | undefined

        const topicFieldMap: Record<string, string> = {
          'entity.folder.label_changed': 'label',
          'entity.folder.renamed': 'name',
          'entity.folder.type_changed': 'folderType',
          'entity.folder.status_changed': 'status',
          'entity.folder.tags_changed': 'tags',
          'entity.folder.attrib_changed': 'attrib',
        }

        const topics = ['entity.folder', 'entity.folder.created', 'entity.folder.deleted']
        const tokens: (string | undefined)[] = []

        // Simplified trailing debounce approach:
        // - Collect updated folder IDs for 2000ms window
        // - If a deletion topic appears, perform one full list refetch (within debounce window)
        // - Otherwise, fetch each pending event and patch existing cache entries only
        const MIN_INTERVAL = 2000
        const pendingMessages = new Map<string, any>()
        let resyncFlag = false // full list refetch needed for deleted folders
        let timer: ReturnType<typeof setTimeout> | null = null
        let processing = false

        const clearTimer = () => {
          if (timer) {
            clearTimeout(timer)
            timer = null
          }
        }

        const schedule = () => {
          clearTimer()
          timer = setTimeout(run, MIN_INTERVAL)
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
                // get full folder list and update cache after folder deletion
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
                pendingMessages.clear()
              }
              return
            }

            if (pendingMessages.size === 0) return
            const messages = Array.from(pendingMessages.values())
            pendingMessages.clear()
            type Patch = {
              folderId: string
              partial?: Record<string, any>
              attribMerge?: Record<string, any>
              updatedAt?: string
            }
            const patches: Patch[] = []
            await Promise.all(
              messages.map(async (message) => {
                try {
                  const topic = message.topic
                  const summary = message.summary || {}
                  const folderId = summary.entityId
                  if (!folderId) return
                  const fieldName = topicFieldMap[topic]
                  if (!fieldName) return

                  // OPTIMIZATION: use value from summary if available (for root level fields)
                  if (summary.value !== undefined && fieldName !== 'attrib') {
                    let value = summary.value

                    // Cast value to proper type
                    if (fieldName === 'tags') {
                      if (!Array.isArray(value)) {
                        value = typeof value === 'string' ? value.split(',').filter(Boolean) : []
                      }
                    } else if (value !== null && typeof value !== 'string') {
                      value = String(value)
                    }

                    const partial: Record<string, any> = {
                      [fieldName]: value,
                      updatedAt: message.updatedAt,
                    }
                    if (summary.parentId !== undefined) partial.parentId = summary.parentId
                    patches.push({ folderId, partial })
                    return
                  }

                  // Fallback: Fetch each event and apply incremental updates
                  const eventId = message.id
                  const event = await dispatch(
                    eventsApi.endpoints.getEvent.initiate({ eventId }, { forceRefetch: true }),
                  ).unwrap()
                  const payload: any = event?.payload || {}
                  const eventSummary: any = event?.summary || {}
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
                    if (eventSummary.parentId !== undefined)
                      partial.parentId = eventSummary.parentId
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
            // If new events came in while we were processing, schedule another run
            if (pendingMessages.size > 0 || resyncFlag) {
              schedule()
            }
          }
        }

        let unsubscribeThumbnails: (() => void) | undefined

        try {
          await cacheDataLoaded

          unsubscribeThumbnails = subscribeToThumbnailUpdates(
            (messages: ThumbnailUpdateMessage[]) => {
              updateCachedData((draft: any) => {
                if (!draft || !Array.isArray(draft.folders)) return
                messages.forEach((message) => {
                  if (message.summary.entityType === 'folder' && message.summary.thumbnailHash) {
                    const idx = draft.folders.findIndex(
                      (f: any) => f.id === message.summary.entityId,
                    )
                    if (idx !== -1) {
                      draft.folders[idx].thumbnailHash = message.summary.thumbnailHash
                    }
                  }
                })
              })
            },
            ['folder'],
          )

          const handlePubSub = (_topic: string, _message: any) => {
            const isMembership = _topic.endsWith('.created') || _topic.endsWith('.deleted')

            if (isMembership) {
              const eventType = _topic.endsWith('.created') ? 'created' : 'deleted'
              // Backward compatibility: If no patch filters are provided, always sync membership.
              // If patch filters ARE provided, only sync if 'created'/'deleted' tokens are present.
              if (patchFields && !patchFields.includes(eventType)) return

              resyncFlag = true
            } else {
              const fieldName = topicFieldMap[_topic]
              // Backward compatibility: If no patch filters are provided, allow all updates (that we have mapping for).
              // If patch filters ARE provided, only allow fields explicitly listed in the patch array.
              if (patchFields && (!fieldName || !patchFields.includes(fieldName))) {
                return
              }

              const eventId = _message?.id
              if (eventId) {
                pendingMessages.set(eventId, _message)
              }
            }

            schedule()
          }

          topics.forEach((t) => tokens.push(PubSub.subscribe(t, handlePubSub)))
        } catch {
          // silent
        }

        await cacheEntryRemoved
        tokens.forEach((t) => PubSub.unsubscribe(t))
        if (unsubscribeThumbnails) unsubscribeThumbnails()
        clearTimer()
      },
    },
  },
})

export const { useGetFolderHierarchyQuery, useGetFolderListQuery } = enhancedApi
export { enhancedApi as foldersQueries }
