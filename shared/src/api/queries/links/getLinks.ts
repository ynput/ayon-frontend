import { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import {
  GetSearchedFoldersQuery,
  GetSearchedProductsQuery,
  GetSearchedRepresentationsQuery,
  GetSearchedTasksQuery,
  GetSearchedVersionsQuery,
  GetSearchedWorkfilesQuery,
  gqlLinksApi,
} from '@shared/api/generated'

export const ENTITIES_INFINITE_QUERY_COUNT = 50 // Number of items to fetch per page

// Define page param type for infinite query
type EntitySearchPageParam = {
  cursor: string
}

export type SearchEntityLink = {
  id: string
  name: string
  entityType: string
  path: string
  label: string
  folderType?: string | undefined
  taskType?: string | undefined
  productType?: string | undefined
}

export type GetSearchedEntitiesLinksResult = {
  pageInfo: any
  entities: SearchEntityLink[]
}

export type GetSearchedEntitiesLinksArgs = {
  projectName: string
  entityType: string // 'folder' | 'product' | 'version' | 'task' | 'representation' | 'workfile'
  search?: string
  parentIds?: string[] // Optional parent IDs to filter entities
  sortBy?: string
}

type GetSearchedEntity =
  | GetSearchedTasksQuery
  | GetSearchedFoldersQuery
  | GetSearchedProductsQuery
  | GetSearchedVersionsQuery
  | GetSearchedRepresentationsQuery
  | GetSearchedWorkfilesQuery
type SearchedTaskNode = GetSearchedTasksQuery['project']['tasks']['edges'][0]['node']
type SearchedFolderNode = GetSearchedFoldersQuery['project']['folders']['edges'][0]['node']
type SearchedProductNode = GetSearchedProductsQuery['project']['products']['edges'][0]['node']
type SearchedVersionNode = GetSearchedVersionsQuery['project']['versions']['edges'][0]['node']
type SearchedRepresentationNode =
  GetSearchedRepresentationsQuery['project']['representations']['edges'][0]['node']
type SearchedWorkfileNode = GetSearchedWorkfilesQuery['project']['workfiles']['edges'][0]['node']

const injectedQueries = gqlLinksApi.injectEndpoints({
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
          const { projectName, entityType, search, parentIds } = queryArg
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

          variables.search = search || ''
          variables.parentIds = parentIds

          let result: GetSearchedEntity
          // Use the appropriate generated query based on entity type
          switch (entityType) {
            case 'folder':
              result = await api
                .dispatch(
                  gqlLinksApi.endpoints.GetSearchedFolders.initiate(variables, {
                    forceRefetch: true,
                  }),
                )
                .unwrap()
              break
            case 'product':
              result = await api
                .dispatch(
                  gqlLinksApi.endpoints.GetSearchedProducts.initiate(variables, {
                    forceRefetch: true,
                  }),
                )
                .unwrap()
              break
            case 'task':
              result = await api
                .dispatch(
                  gqlLinksApi.endpoints.GetSearchedTasks.initiate(variables, {
                    forceRefetch: true,
                  }),
                )
                .unwrap()
              break
            case 'version':
              result = await api
                .dispatch(
                  gqlLinksApi.endpoints.GetSearchedVersions.initiate(variables, {
                    forceRefetch: true,
                  }),
                )
                .unwrap()
              break
            case 'representation':
              result = await api
                .dispatch(
                  gqlLinksApi.endpoints.GetSearchedRepresentations.initiate(variables, {
                    forceRefetch: true,
                  }),
                )
                .unwrap()
              break
            case 'workfile':
              result = await api
                .dispatch(
                  gqlLinksApi.endpoints.GetSearchedWorkfiles.initiate(variables, {
                    forceRefetch: true,
                  }),
                )
                .unwrap()
              break
            default:
              throw new Error(`Unsupported entity type: ${entityType}`)
          }

          const projectData = result.project
          if (!projectData) {
            throw new Error('No project data returned')
          }

          // @ts-expect-error - TypeScript doesn't know the structure of projectData
          const entityData = projectData[entityType + 's']

          // Transform entity data to search link format
          const entities: SearchEntityLink[] = entityData?.edges
            ?.map(({ node }: any) => {
              switch (entityType) {
                case 'task':
                  const taskNode = node as SearchedTaskNode
                  return {
                    entityType: 'task',
                    id: taskNode.id,
                    name: taskNode.name,
                    label: taskNode.label || taskNode.name,
                    path: taskNode.folder?.path || '',
                    taskType: taskNode.taskType,
                  }
                case 'folder':
                  const folderNode = node as SearchedFolderNode
                  return {
                    entityType: 'folder',
                    id: folderNode.id,
                    name: folderNode.name,
                    label: folderNode.label || folderNode.name,
                    path: folderNode.parent?.path || '',
                    folderType: folderNode.folderType,
                  }
                case 'product':
                  const productNode = node as SearchedProductNode
                  return {
                    entityType: 'product',
                    id: productNode.id,
                    name: productNode.name,
                    label: productNode.name,
                    path: productNode.folder?.path,
                    productType: productNode.productType,
                  }
                case 'version':
                  const versionNode = node as SearchedVersionNode
                  return {
                    entityType: 'version',
                    id: versionNode.id,
                    name: versionNode.name,
                    label: versionNode.name,
                    path: `${versionNode.product.folder.path}/${versionNode.product.name}`,
                  }
                case 'representation':
                  const representationNode = node as SearchedRepresentationNode
                  return {
                    entityType: 'representation',
                    id: representationNode.id,
                    name: representationNode.name,
                    label: representationNode.name,
                    path: `${representationNode.version.product.folder.path}/${representationNode.version.product.name}/${representationNode.version.name}`,
                  }
                case 'workfile':
                  const workfileNode = node as SearchedWorkfileNode
                  return {
                    entityType: 'workfile',
                    id: workfileNode.id,
                    name: workfileNode.name,
                    label: workfileNode.name,
                    path: `${workfileNode.task.folder.path}/${workfileNode.task.name}`,
                  }
                default:
                  return null
              }
            })
            .filter(Boolean) as SearchEntityLink[] // Remove nulls, ensure correct type

          if (!entityData) {
            throw new Error(`No ${entityType} data returned`)
          }

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
    }),
  }),
})

export const { useGetSearchedEntitiesLinksInfiniteQuery } = injectedQueries
