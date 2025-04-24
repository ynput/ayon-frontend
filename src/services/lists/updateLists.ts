import { api } from '@api/rest/lists'

const updateListsEnhancedApi = api.enhanceEndpoints({
  endpoints: {
    createEntityList: {
      invalidatesTags: [{ type: 'entityList', id: 'LIST' }],
    },
    deleteEntityList: {
      invalidatesTags: [{ type: 'entityList', id: 'LIST' }],
    },
  },
})

export const { useCreateEntityListMutation, useDeleteEntityListMutation } = updateListsEnhancedApi
