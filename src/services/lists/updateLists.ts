import { api } from '@api/rest/lists'
import gqlApi from './getLists'

const updateListsEnhancedApi = api.enhanceEndpoints({
  endpoints: {
    createEntityList: {
      invalidatesTags: [{ type: 'entityList', id: 'LIST' }],
    },
    updateEntityList: {
      async onQueryStarted(
        { listId, projectName, entityListPatchModel },
        { dispatch, queryFulfilled },
      ) {
        const patchResult = dispatch(
          gqlApi.util.updateQueryData('getListsInfinite', { projectName }, (draft) => {
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
        try {
          await queryFulfilled
        } catch {
          patchResult.undo()
        }
      },
      invalidatesTags: [{ type: 'entityList', id: 'LIST' }],
    },
    deleteEntityList: {
      invalidatesTags: [{ type: 'entityList', id: 'LIST' }],
    },
  },
})

export const {
  useCreateEntityListMutation,
  useUpdateEntityListMutation,
  useDeleteEntityListMutation,
} = updateListsEnhancedApi
