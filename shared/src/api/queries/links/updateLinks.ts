import { linksApi } from '@shared/api/generated'

const enhancedApi = linksApi.enhanceEndpoints({
  endpoints: {
    deleteEntityLink: {
      transformErrorResponse: (error: any) => error.data?.detail || '',
    },
  },
})

export const { useDeleteEntityLinkMutation } = enhancedApi
