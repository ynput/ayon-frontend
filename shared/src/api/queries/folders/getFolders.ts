import { FolderListItem, foldersApi, GetNewFoldersQuery, gqlApi } from '@shared/api/generated'
import {
  getSupportedEntityPatch,
  createRealtimeBatcher,
  REALTIME_REST_CALL_LIMIT,
  waitForRealtimeJitter,
  PubSub,
  subscribeToThumbnailUpdates,
  ThumbnailUpdateMessage,
  SupportedEntityPatchField,
} from '@shared/util'

import { DefinitionsFromApi, OverrideResultType, TagTypesFromApi } from '@reduxjs/toolkit/query'

type GetNewFoldersResult = FolderListItem[]

// HELPER QUERIES FOR REALTIME UPDATES
type Definitions = DefinitionsFromApi<typeof gqlApi>
type TagTypes = TagTypesFromApi<typeof gqlApi>
// update the definitions to include the new types
type UpdatedDefinitions = Omit<Definitions, 'GetNewFolders'> & {
  GetNewFolders: OverrideResultType<Definitions['GetNewFolders'], GetNewFoldersResult>
}

const graphqlFolders = gqlApi.enhanceEndpoints<TagTypes, UpdatedDefinitions>({
  endpoints: {
    GetNewFolders: {
      transformResponse: (response: GetNewFoldersQuery): GetNewFoldersResult =>
        response.project.folders.edges.map(({ node }) => ({
          ...node,
          path: node.path ?? '',
          parentId: node.parentId ?? undefined,
          label: node.label ?? undefined,
          taskNames: [],
          createdAt: String(node.createdAt),
          updatedAt: String(node.updatedAt),
        })),
    },
  },
})

// the max number of folder to process in a single batch
// TODO: Use this limit to trigger the reload button
export const MAX_FOLDER_UPDATE_REST_CALLS = REALTIME_REST_CALL_LIMIT

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
        { cacheDataLoaded, cacheEntryRemoved, updateCachedData, getCacheEntry, dispatch },
      ) {
        const { projectName } = args || {}
        const supportedFolderFields = ['status', 'tags', 'folderType']
        const topicFieldMap: Record<string, string> = {
          'entity.folder.label_changed': 'label',
          'entity.folder.renamed': 'name',
          'entity.folder.type_changed': 'folderType',
          'entity.folder.status_changed': 'status',
          'entity.folder.tags_changed': 'tags',
          'entity.folder.attrib_changed': 'attrib',
        }

        const topics = ['entity.folder']
        const tokens: (string | undefined)[] = []

        // handle a batch of messages, updating the cache and fetching missing data as needed
        const batchProcessMessages = async (messages: any[]) => {
          if (!projectName) return

          const cachedFolderIds = new Set<string>()
          const cachedFolders = getCacheEntry().data
          if (cachedFolders && Array.isArray(cachedFolders.folders)) {
            cachedFolders.folders.forEach((folder: any) => cachedFolderIds.add(folder.id))
          }

          const deletedIds: string[] = []
          const createdIds: string[] = []
          const unsupportedIds: string[] = []
          const summaryPatches: {
            folderId: string
            field: SupportedEntityPatchField
            value: string | string[]
          }[] = []

          // for each message, check it's type and then add it to the appropriate list for processing
          messages.forEach((message) => {
            const folderId = message.summary?.entityId
            if (!folderId) return

            // delete: remove from cache - no additional API calls
            if (message.topic === 'entity.folder.deleted') {
              deletedIds.push(folderId)
              return
            }

            // create: add to cache - will fetch the full folder data later
            if (message.topic === 'entity.folder.created') {
              createdIds.push(folderId)
              return
            }

            // for updates, check if the folder is in the cache
            // no point updating a folder that does not exist for the user
            if (!cachedFolderIds.has(folderId)) return

            // check if the updated field data is in the summary  (status, tags etc)
            // if it is, we can update the cache directly, otherwise we will need to fetch the full folder data later
            const patch = getSupportedEntityPatch(
              topicFieldMap[message.topic],
              message.summary,
              supportedFolderFields,
            )
            if (patch) summaryPatches.push({ folderId, ...patch })
            else unsupportedIds.push(folderId)
          })

          // DELETED: remove deleted folders from cache
          if (deletedIds.length) {
            updateCachedData((draft: any) => {
              if (!draft || !Array.isArray(draft.folders)) return
              draft.folders = draft.folders.filter((folder: any) => !deletedIds.includes(folder.id))
            })
          }

          // UPDATED: update cached folders with summary data from the message, if available
          if (summaryPatches.length) {
            updateCachedData((draft: any) => {
              if (!draft || !Array.isArray(draft.folders)) return
              summaryPatches.forEach(({ folderId, field, value }) => {
                const folder = draft.folders.find((item: any) => item.id === folderId)
                if (folder) folder[field] = value
              })
            })
          }

          // For created and unsupported folders, we will fetch the full folder data from the API
          // But first, check if the total number of folders to fetch exceeds the max limit, and if so, skip fetching
          // This is to avoid overwhelming the API with too many requests at once, and to prevent potential performance issues in the frontend.
          if (createdIds.length + unsupportedIds.length > MAX_FOLDER_UPDATE_REST_CALLS) return

          // CREATED: fetch created folders from the API and add them to the cache
          // (Created folders are fetched separately from unsupported updates.)
          if (createdIds.length) {
            await waitForRealtimeJitter()
            const createdFolders = await dispatch(
              graphqlFolders.endpoints.GetNewFolders.initiate({
                projectName,
                folderIds: createdIds,
                first: createdIds.length,
              }),
            )
              .unwrap()
              .catch(() => [])

            // Add newly created folders to the cache, or update existing ones if they already exist (e.g., if a folder was created and then updated before the cache was refreshed).
            updateCachedData((draft: any) => {
              if (!draft || !Array.isArray(draft.folders)) return
              createdFolders.filter(Boolean).forEach((folder: any) => {
                const index = draft.folders.findIndex((item: any) => item.id === folder.id)
                if (index === -1) draft.folders.push(folder)
                else draft.folders[index] = { ...draft.folders[index], ...folder }
              })
            })
          }

          // UPDATED (unsupported): fetch unsupported folders from the API and update them in the cache
          if (unsupportedIds.length) {
            const updatedFolders = await Promise.all(
              unsupportedIds.map(async (folderId) => {
                await waitForRealtimeJitter()
                return dispatch(
                  foldersApi.endpoints.getFolder.initiate(
                    { projectName, folderId },
                    { forceRefetch: true },
                  ),
                )
                  .unwrap()
                  .catch(() => null)
              }),
            )
            updateCachedData((draft: any) => {
              if (!draft || !Array.isArray(draft.folders)) return
              updatedFolders.filter(Boolean).forEach((folder: any) => {
                const index = draft.folders.findIndex((item: any) => item.id === folder.id)
                if (index !== -1) draft.folders[index] = { ...draft.folders[index], ...folder }
              })
            })
          }
        }

        // create a batcher to process messages in batches
        const batcher = createRealtimeBatcher(
          batchProcessMessages,
          (message: any) => message.summary.entityId,
        )

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

          const handlePubSub = (topic: string, message: any) => {
            const entityId = message?.summary?.entityId
            if (!entityId) return

            // add update to the batcher
            batcher.add({ ...message, topic })
          }

          topics.forEach((t) => tokens.push(PubSub.subscribe(t, handlePubSub)))
        } catch {
          // silent
        }

        await cacheEntryRemoved
        batcher.clear()
        tokens.forEach((t) => PubSub.unsubscribe(t))
        if (unsubscribeThumbnails) unsubscribeThumbnails()
        batcher.clear()
      },
    },
  },
})

export const { useGetFolderHierarchyQuery, useGetFolderListQuery } = enhancedApi
export { enhancedApi as foldersQueries }
