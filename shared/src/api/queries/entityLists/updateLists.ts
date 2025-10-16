import { entityListsApi } from '@shared/api/generated'
import gqlApi from './getLists'
import { CreateSessionFromListApiArg, CreateSessionFromListApiResponse } from './types'
import { refetchFilteredListItems } from './refetchFilteredListItems'

const updateListsEnhancedApi = entityListsApi.enhanceEndpoints({
  endpoints: {
    // LIST MUTATIONS
    createEntityList: {
      invalidatesTags: [{ type: 'entityList', id: 'LIST' }],
    },
    updateEntityList: {
      async onQueryStarted(
        { listId, entityListPatchModel },
        { dispatch, queryFulfilled, getState },
      ) {
        const state = getState()
        // Find all caches that are invalidated by this mutation
        const tags = [{ type: 'entityList', id: listId }]
        const infiniteEntries = gqlApi.util
          .selectInvalidatedBy(state, tags)
          .filter((e) => e.endpointName === 'getListsInfinite')

        let patchResults: any[] = []

        // Update getListsInfinite cache (GraphQL)
        for (const entry of infiniteEntries) {
          const patchResult = dispatch(
            gqlApi.util.updateQueryData('getListsInfinite', entry.originalArgs, (draft) => {
              for (const page of draft.pages) {
                const listIndex = page.lists.findIndex((list) => list.id === listId)
                if (listIndex !== -1) {
                  const list = page.lists[listIndex]
                  // Update the list with the new data
                  Object.assign(list, entityListPatchModel)
                  break
                }
              }
            }),
          )
          // Store the patch result to undo it later if needed
          patchResults.push(patchResult)
        }

        // Update getEntityList cache (REST API)
        const entityListEntries = entityListsApi.util
          .selectInvalidatedBy(state, tags)
          .filter((e) => e.endpointName === 'getEntityList' && e.originalArgs.listId === listId)

        for (const entry of entityListEntries) {
          const patchResult = dispatch(
            entityListsApi.util.updateQueryData('getEntityList', entry.originalArgs, (draft) => {
              // Update the entity list with the new data
              Object.assign(draft, {
                ...draft,
                ...entityListPatchModel,
              })
            }),
          )
          // Store the patch result to undo it later if needed
          patchResults.push(patchResult)
        }

        try {
          await queryFulfilled
        } catch {
          patchResults.forEach((patchResult) => {
            // Undo the optimistic update if the mutation fails
            patchResult.undo()
          })
        }
      },
      transformErrorResponse: (error: any) => error.data.detail,
      // invalidatesTags: (_s, _e, { listId }) => {
      //   const tags = [{ type: 'entityList', id: listId }]
      //   return tags
      // },
    },
    deleteEntityList: {
      invalidatesTags: [{ type: 'entityList', id: 'LIST' }],
    },
    // LIST ITEM MUTATIONS
    updateEntityListItems: {
      async onQueryStarted(
        { listId, entityListMultiPatchModel },
        { dispatch, queryFulfilled, getState },
      ) {
        const state = getState()
        // Find all caches that are invalidated by this mutation
        // We are primarily interested in updating the items within a specific list
        const tags = [{ type: 'entityListItem', id: listId }]
        const infiniteEntries = gqlApi.util
          .selectInvalidatedBy(state, tags)
          .filter((e) => e.endpointName === 'getListItemsInfinite')

        let patchResults: any[] = []

        if (!entityListMultiPatchModel.items || entityListMultiPatchModel.items.length === 0) {
          // No items to update, proceed without optimistic update
          await queryFulfilled
          return
        }

        for (const entry of infiniteEntries) {
          // only update entries that match the listId
          if (entry.originalArgs.listId !== listId) continue

          const patchResult = dispatch(
            gqlApi.util.updateQueryData('getListItemsInfinite', entry.originalArgs, (draft) => {
              let overallPositionChanged = false
              // First pass: update items in place and check if any position changed
              for (const page of draft.pages) {
                entityListMultiPatchModel.items?.forEach((patchItem) => {
                  const itemIndex = page.items.findIndex(
                    (item) => item.id === patchItem.id || item.entityId === patchItem.entityId,
                  )

                  if (itemIndex !== -1) {
                    const existingItem = page.items[itemIndex]
                    // Merge existing item with patchItem, ensuring attrib is also merged
                    const updatedItem = {
                      ...existingItem,
                      ...patchItem, // Apply all top-level fields from patchItem
                      attrib: {
                        ...existingItem.attrib,
                        ...(patchItem.attrib || {}), // Merge attrib safely
                      },
                    }
                    Object.assign(page.items[itemIndex], updatedItem)

                    if (patchItem.position !== undefined) {
                      overallPositionChanged = true
                    }
                  }
                })
              }

              if (overallPositionChanged) {
                // Collect all items from all pages for this specific cache entry
                let allItems = draft.pages.flatMap((page) => page.items)

                // Sort all items based on position, using updated positions from the map
                allItems.sort((a, b) => {
                  const posA = typeof a.position === 'number' ? a.position : Infinity
                  const posB = typeof b.position === 'number' ? b.position : Infinity
                  return posA - posB
                })

                // Re-distribute sorted items back into pages, maintaining original page sizes
                let currentItemIndex = 0
                for (const page of draft.pages) {
                  const pageItemCount = page.items.length // Get original item count for this page
                  // Replace page items with the corresponding slice from the globally sorted list
                  page.items = allItems.slice(currentItemIndex, currentItemIndex + pageItemCount)
                  currentItemIndex += pageItemCount
                }
              }
            }),
          )
          // Store the patch result to undo it later if needed
          patchResults.push(patchResult)
        }

        try {
          await queryFulfilled

          // Background refetch logic - runs after successful mutation
          // This ensures calculated attributes are up-to-date and items are correctly filtered
          const updatedEntityIds = (entityListMultiPatchModel.items || [])
            .map((item) => item.entityId)
            .filter(Boolean) as string[]

          if (updatedEntityIds.length > 0 && listId) {
            // Get project name from the first entry's original args
            const projectName = infiniteEntries[0]?.originalArgs?.projectName

            if (projectName) {
              // Refetch each cache entry with its specific filters
              for (const entry of infiniteEntries) {
                if (entry.originalArgs.listId === listId) {
                  await refetchFilteredListItems({
                    dispatch,
                    projectName,
                    listId,
                    updatedItemIds: updatedEntityIds,
                    cacheEntry: entry,
                  })
                }
              }
            }
          }
        } catch {
          patchResults.forEach((patchResult) => {
            // Undo the optimistic update if the mutation fails
            patchResult.undo()
          })
        }
      },
      invalidatesTags: (_s, _e, { listId, entityListMultiPatchModel: { items } }) => {
        // Check if this is a position-only update (reordering)
        const isReorderingOnly = items?.every((item) =>
          Object.keys(item).every((key) => key === 'id' || key === 'position'),
        )

        // Don't invalidate cache for reordering - the optimistic update is sufficient
        // This prevents the cache refetch from overwriting client-side positions of restricted entities
        if (isReorderingOnly) {
          return []
        }

        // For other updates, invalidate as normal
        const tags = [
          { type: 'entityList', id: listId },
          { type: 'entityListItem', id: listId },
          ...(items || []).flatMap((i) =>
            (i.id ? [{ type: 'entityListItem', id: i.id }] : []).concat(
              i.entityId ? [{ type: 'entityListItem', id: i.entityId }] : [],
            ),
          ),
        ]
        return tags
      },
    },
    updateEntityListItem: {
      async onQueryStarted(
        { listItemId, entityListItemPatchModel },
        { dispatch, queryFulfilled, getState },
      ) {
        const state = getState()
        // Find all caches that are invalidated by this mutation
        const tags = [{ type: 'entityListItem', id: listItemId }]
        const infiniteEntries = gqlApi.util
          .selectInvalidatedBy(state, tags)
          .filter((e) => e.endpointName === 'getListItemsInfinite')

        let patchResults: any[] = []
        for (const entry of infiniteEntries) {
          const patchResult = dispatch(
            gqlApi.util.updateQueryData('getListItemsInfinite', entry.originalArgs, (draft) => {
              for (const page of draft.pages) {
                const listIndex = page.items.findIndex((list) => list.id === listItemId)
                if (listIndex !== -1) {
                  const list = page.items[listIndex]
                  const newListItem = {
                    ...list,
                    attrib: {
                      ...list.attrib,
                      ...entityListItemPatchModel.attrib,
                    },
                  }
                  // Update the list with the new data
                  Object.assign(list, newListItem)
                  break
                }
              }
            }),
          )
          // Store the patch result to undo it later if needed
          patchResults.push(patchResult)
        }
        try {
          await queryFulfilled
        } catch {
          patchResults.forEach((patchResult) => {
            // Undo the optimistic update if the mutation fails
            patchResult.undo()
          })
        }
      },
    },
    createEntityListItem: {
      invalidatesTags: (_s, _e, { listId }) => [
        { type: 'entityList', id: listId },
        { type: 'entityListItem', id: listId },
      ],
    },
    deleteEntityListItem: {
      invalidatesTags: (_s, _e, { listId }) => [
        { type: 'entityList', id: listId },
        { type: 'entityListItem', id: listId },
      ],
    },
  },
})

// inject review addon endpoint Create Session From List
const updateListsInjectedApi = updateListsEnhancedApi.injectEndpoints({
  endpoints: (build) => ({
    createSessionFromList: build.mutation<
      CreateSessionFromListApiResponse,
      CreateSessionFromListApiArg
    >({
      query: (queryArg) => ({
        url: `/api/addons/review/${queryArg.addonVersion}/${queryArg.projectName}/sessions/fromList`,
        method: 'POST',
        body: queryArg.sessionFromListRequest,
      }),
      transformErrorResponse: (error: any) => error.data.detail,
      invalidatesTags: () => [{ type: 'entityList', id: 'LIST' }],
    }),
  }),
})

export const {
  // LIST MUTATIONS
  useCreateEntityListMutation,
  useUpdateEntityListMutation,
  useDeleteEntityListMutation,
  // LIST ITEM MUTATIONS
  useUpdateEntityListItemsMutation,
  useUpdateEntityListItemMutation,
  useCreateEntityListItemMutation,
  useDeleteEntityListItemMutation,
  // REVIEW SESSION MUTATIONS
  useCreateSessionFromListMutation,
} = updateListsInjectedApi
export { updateListsInjectedApi as entityListsQueriesRest, gqlApi as entityListsQueriesGql }
