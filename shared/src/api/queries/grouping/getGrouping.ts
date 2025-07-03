import { groupingApi } from '@shared/api/generated'

const enhancedGroupingApi = groupingApi.enhanceEndpoints({
  endpoints: {
    getEntityGroups: {},
  },
})

export const { useGetEntityGroupsQuery } = enhancedGroupingApi
export { enhancedGroupingApi as groupingQueries }
