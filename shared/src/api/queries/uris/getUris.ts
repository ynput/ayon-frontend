import { uRIsApi } from '@shared/api/generated'

const enhancedUrisApi = uRIsApi.enhanceEndpoints({
  endpoints: {
    resolveUris: {},
  },
})

export const { useResolveUrisMutation } = enhancedUrisApi
