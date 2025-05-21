import { entityListsApi } from '@shared/api/generated'
import gqlApi from './getLists'
import { current } from '@reduxjs/toolkit'

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
        try {
          await queryFulfilled
        } catch {
          patchResults.forEach((patchResult) => {
            // Undo the optimistic update if the mutation fails
            patchResult.undo()
          })
        }
      },
      invalidatesTags: (_s, _e, { listId }) => {
        const tags = [{ type: 'entityList', id: listId }]
        return tags
      },
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

                // Sort all items based on position
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
        } catch {
          patchResults.forEach((patchResult) => {
            // Undo the optimistic update if the mutation fails
            patchResult.undo()
          })
        }
      },
      invalidatesTags: (_s, _e, { listId, entityListMultiPatchModel: { items } }) => {
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
} = updateListsEnhancedApi
export { updateListsEnhancedApi as entityListsQueriesRest, gqlApi as entityListsQueriesGql }
