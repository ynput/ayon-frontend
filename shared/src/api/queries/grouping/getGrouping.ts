import { groupingApi } from '@shared/api/generated'
import { PubSub } from '@shared/util'

const enhancedGroupingApi = groupingApi.enhanceEndpoints({
  endpoints: {
    getEntityGroups: {},
  },
})

export const { useGetEntityGroupsQuery } = enhancedGroupingApi
export { enhancedGroupingApi as groupingQueries }
