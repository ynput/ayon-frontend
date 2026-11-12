import { entityListsApi } from '@shared/api/generated'

// REST API (get list attributes)
const getListsRestApiEnhanced = entityListsApi.enhanceEndpoints({
  endpoints: {
    getEntityListAttributesDefinition: {
      providesTags: (result, _e, { entityListId }) =>
        result
          ? [
              { type: 'entityListAttribute', id: entityListId },
              ...result.map((a) => ({ type: 'entityListAttribute', id: a.name })),
            ]
          : [{ type: 'entityListAttribute', id: 'LIST' }],
    },
  },
})

export const { useGetEntityListAttributesDefinitionQuery } = getListsRestApiEnhanced
export default getListsRestApiEnhanced
