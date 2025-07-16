import { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { GetSearchedTasksQuery, gqlApi } from '@shared/api/generated'

export const ENTITIES_INFINITE_QUERY_COUNT = 50 // Number of items to fetch per page

// Define page param type for infinite query
type EntitySearchPageParam = {
  cursor: string
}

export type GetSearchedEntitiesLinksResult = {
  pageInfo: any
  entities: {
    id: string
    name: string
    label?: string | undefined
    folderType?: string | undefined
    taskType?: string | undefined
    productType?: string | undefined
    entityType: string
  }[]
}

export type GetSearchedEntitiesLinksArgs = {
  projectName: string
  entityType: string // 'folder' | 'product' | 'version' | 'task' | 'representation' | 'workfile'
  search?: string
  sortBy?: string
}

export const supportedEntityTypes = ['task']

const injectedQueries = gqlApi.injectEndpoints({
  endpoints: (build) => ({
    getSearchedEntitiesLinks: build.infiniteQuery<
      GetSearchedEntitiesLinksResult,
      GetSearchedEntitiesLinksArgs,
      EntitySearchPageParam
    >({
      infiniteQueryOptions: {
        initialPageParam: { cursor: '' },
        getNextPageParam: (lastPage, _allPages, lastPageParam) => {
          const pageInfo = lastPage.pageInfo
          if (!pageInfo.hasNextPage || !pageInfo.endCursor) return undefined
          return { cursor: pageInfo.endCursor }
        },
      },
      queryFn: async ({ queryArg, pageParam }, api) => {
        try {
          const { projectName, entityType, search } = queryArg
          const { cursor } = pageParam

          // Build query variables
          const variables: any = {
            projectName,
            first: ENTITIES_INFINITE_QUERY_COUNT,
          }

          // Add cursor-based pagination
          if (cursor) {
            variables.after = cursor
          }

          // Add search parameter based on entity type
          if (entityType === 'version') {
            variables.filter = search || ''
          } else {
            variables.search = search || ''
          }

          let result: GetSearchedTasksQuery

          // Use the appropriate generated query based on entity type
          switch (entityType) {
            case 'folder':
              throw new Error('Folder search is not implemented yet')
            case 'product':
              throw new Error('Product search is not implemented yet')
            case 'task':
              result = await api
                .dispatch(
                  gqlApi.endpoints.GetSearchedTasks.initiate(variables, { forceRefetch: true }),
                )
                .unwrap()
              break
            case 'version':
              throw new Error('Version search is not implemented yet')
            case 'representation':
              throw new Error('Representation search is not implemented yet')
            case 'workfile':
              throw new Error('Workfile search is not implemented yet')
            default:
              throw new Error(`Unsupported entity type: ${entityType}`)
          }

          const projectData = result.project
          if (!projectData) {
            throw new Error('No project data returned')
          }

          const entityData: GetSearchedTasksQuery['project']['tasks'] =
            //   @ts-expect-error - The type of projectData[entityType + 's'] is not known
            projectData[entityType + 's']
          if (!entityData) {
            throw new Error(`No ${entityType} data returned`)
          }

          // Transform the response to match expected format
          const entities = entityData.edges.map(({ node }) => ({
            id: node.id,
            name: node.name,
            label: node.label || undefined,
            folderType: undefined,
            taskType: node.taskType,
            productType: undefined,
            entityType: entityType,
          }))

          return {
            data: {
              pageInfo: entityData.pageInfo,
              entities: entities,
            },
          }
        } catch (error: any) {
          console.error('Error in getSearchedEntitiesLinks queryFn:', error)
          return { error: { status: 'FETCH_ERROR', error: error.message } as FetchBaseQueryError }
        }
      },
      //   providesTags: (result, _e, { entityType }) =>
      //     result?.pages?.flatMap((entity) => ({
      //       type: entityType,
      //       id: entity.,
      //     })) || [{ type: entityType, id: 'LIST' }],
    }),
  }),
})

export const { useGetSearchedEntitiesLinksInfiniteQuery } = injectedQueries
