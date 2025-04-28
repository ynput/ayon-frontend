import { api } from '@api/rest/lists'
import gqlApi from './getLists'

const updateListsEnhancedApi = api.enhanceEndpoints({
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
        console.log('invalidatesTags', tags)
        return tags
      },
    },
    deleteEntityList: {
      invalidatesTags: [{ type: 'entityList', id: 'LIST' }],
    },
    // LIST ITEM MUTATIONS
    updateEntityListItems: {
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
    createEntityListItem: {
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
  useCreateEntityListItemMutation,
} = updateListsEnhancedApi
