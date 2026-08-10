import {
  FolderListItem,
  foldersApi,
  GetUpdatedAndNewFoldersQuery,
  gqlApi,
} from '@shared/api/generated'
import {
  getSupportedEntityPatch,
  createRealtimeBatcher,
  REALTIME_REST_CALL_LIMIT,
  waitForRealtimeJitter,
  PubSub,
  RealtimeBatchProcessor,
  subscribeToThumbnailUpdates,
  ThumbnailUpdateMessage,
  SupportedEntityPatchField,
} from '@shared/util'

import { DefinitionsFromApi, OverrideResultType, TagTypesFromApi } from '@reduxjs/toolkit/query'
import { parseJSONField } from '../overview'

type GetUpdatedAndNewFoldersResult = FolderListItem[]

// HELPER QUERIES FOR REALTIME UPDATES
type Definitions = DefinitionsFromApi<typeof gqlApi>
type TagTypes = TagTypesFromApi<typeof gqlApi>
// update the definitions to include the new types
type UpdatedDefinitions = Omit<Definitions, 'GetUpdatedAndNewFolders'> & {
  GetUpdatedAndNewFolders: OverrideResultType<
    Definitions['GetUpdatedAndNewFolders'],
    GetUpdatedAndNewFoldersResult
  >
}

const graphqlFolders = gqlApi.enhanceEndpoints<TagTypes, UpdatedDefinitions>({
  endpoints: {
    GetUpdatedAndNewFolders: {
      transformResponse: (response: GetUpdatedAndNewFoldersQuery): GetUpdatedAndNewFoldersResult =>
        response.project.folders.edges.map(({ node }) => ({
          ...node,
          attrib: parseJSONField(node.allAttrib),
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
        const batchProcessMessages: RealtimeBatchProcessor<any> = async (messages, isActive) => {
          if (!projectName) return

          const cachedFolderIds = new Set<string>()
          const cachedFolders = getCacheEntry().data
          if (cachedFolders && Array.isArray(cachedFolders.folders)) {
            cachedFolders.folders.forEach((folder: any) => cachedFolderIds.add(folder.id))
          }

          const deletedIds: string[] = []
          const createdIds: string[] = []
          const unsupportedFields = new Map<string, Set<string>>()
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
            else {
              const field = topicFieldMap[message.topic]
              if (!field) return

              const fields = unsupportedFields.get(folderId) || new Set<string>()
              fields.add(field)
              unsupportedFields.set(folderId, fields)
            }
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

          // Fetch created and unsupported folders in one request.
          // This is to avoid overwhelming the API with too many requests at once, and to prevent potential performance issues in the frontend.
          const foldersToFetch = [...new Set([...createdIds, ...unsupportedFields.keys()])]
          if (foldersToFetch.length > MAX_FOLDER_UPDATE_REST_CALLS) return

          if (foldersToFetch.length) {
            await waitForRealtimeJitter()
            const fetchedFolders = await dispatch(
              graphqlFolders.endpoints.GetUpdatedAndNewFolders.initiate({
                projectName,
                folderIds: foldersToFetch,
                first: foldersToFetch.length,
              }),
            )
              .unwrap()
              .catch(() => [])

            if (!isActive()) return
            const createdFolderIds = new Set(createdIds)
            updateCachedData((draft: any) => {
              if (!draft || !Array.isArray(draft.folders)) return
              const fetchedById = new Map(
                fetchedFolders.filter(Boolean).map((folder: any) => [folder.id, folder] as const),
              )

              draft.folders.forEach((folder: any, index: number) => {
                const fetchedFolder = fetchedById.get(folder.id)
                if (!fetchedFolder) return

                if (createdFolderIds.has(folder.id)) {
                  draft.folders[index] = { ...folder, ...fetchedFolder }
                } else {
                  const fields = unsupportedFields.get(folder.id) || new Set<string>()
                  fields.forEach((field) => {
                    folder[field] = fetchedFolder[field]
                  })
                }
                fetchedById.delete(folder.id)
              })

              fetchedById.forEach((folder, folderId) => {
                if (createdFolderIds.has(folderId)) draft.folders.push(folder)
              })
            })
          }
        }

        // create a batcher to process messages in batches
        const batcher = createRealtimeBatcher(
          batchProcessMessages,
          (message: any) =>
            `${message.project ?? projectName}:${message.summary?.entityId}:${message.topic}`,
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
        tokens.forEach((t) => PubSub.unsubscribe(t))
        if (unsubscribeThumbnails) unsubscribeThumbnails()
        batcher.clear()
      },
    },
  },
})

export const { useGetFolderHierarchyQuery, useGetFolderListQuery } = enhancedApi
export { enhancedApi as foldersQueries }
