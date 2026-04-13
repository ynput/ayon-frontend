import { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import {
  GetFolderLinkDataQuery,
  GetSearchedFoldersQuery,
  GetSearchedProductsQuery,
  GetSearchedRepresentationsQuery,
  GetSearchedTasksQuery,
  GetSearchedVersionsQuery,
  GetSearchedWorkfilesQuery,
  GetTaskLinkDataQuery,
  GetProductLinkDataQuery,
  GetVersionLinkDataQuery,
  ResolvedEntityModel,
  ResolvedUriModel,
  gqlLinksApi,
  uRIsApi,
} from '@shared/api/generated'
import { PubSub } from '@shared/util'

export const ENTITIES_INFINITE_QUERY_COUNT = 50 // Number of items to fetch per page

// Define page param type for infinite query
type EntitySearchPageParam = {
  cursor: string
}

export type SearchEntityThumbnail = {
  id: string
  relation?: string
  sourceEntityId?: string
  sourceEntityType?: string
}

export type SearchEntityLink = {
  id: string
  name: string
  entityType: string
  parents: string[]
  label: string
  icon?: string
  subType: string | undefined
  updatedAt?: string
  thumbnail?: SearchEntityThumbnail
  thumbnailId?: string
  targetEntityType?: string
  targetEntityId?: string
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
type ExactEntityType = 'folder' | 'product' | 'task' | 'version'
type ExactFolderNode = NonNullable<GetFolderLinkDataQuery['project']['folder']>
type ExactProductNode = NonNullable<GetProductLinkDataQuery['project']['product']>
type ExactTaskNode = NonNullable<GetTaskLinkDataQuery['project']['task']>
type ExactVersionNode = NonNullable<GetVersionLinkDataQuery['project']['version']>
type ExactEntityNode = ExactFolderNode | ExactProductNode | ExactTaskNode | ExactVersionNode

export type GetExactEntityLinkDataArgs = {
  projectName: string
  uri: string
}

const exactEntityTypes = ['folder', 'product', 'task', 'version'] as const
const exactEntityPriority: Record<ExactEntityType, number> = {
  folder: 0,
  task: 1,
  product: 2,
  version: 3,
}
const resolvedEntityIdKeyByType: Record<ExactEntityType, keyof ResolvedEntityModel> = {
  folder: 'folderId',
  product: 'productId',
  task: 'taskId',
  version: 'versionId',
}

const mapSearchEntityThumbnail = (
  thumbnail?: {
    id: string
    relation?: string | null
    sourceEntityId?: string | null
    sourceEntityType?: string | null
  } | null,
): SearchEntityThumbnail | undefined =>
  thumbnail
    ? {
        id: thumbnail.id,
        relation: thumbnail.relation || undefined,
        sourceEntityId: thumbnail.sourceEntityId || undefined,
        sourceEntityType: thumbnail.sourceEntityType || undefined,
      }
    : undefined

const mapEntityNodeToSearchEntityLink = (
  entityType: SearchEntityLink['entityType'],
  node:
    | SearchedTaskNode
    | SearchedFolderNode
    | SearchedProductNode
    | SearchedVersionNode
    | SearchedRepresentationNode
    | SearchedWorkfileNode
    | ExactEntityNode,
): SearchEntityLink | null => {
  switch (entityType) {
    case 'task': {
      const taskNode = node as SearchedTaskNode | ExactTaskNode
      return {
        entityType: 'task',
        id: taskNode.id,
        name: taskNode.name,
        label: taskNode.label || taskNode.name,
        parents: taskNode.parents || [],
        subType: taskNode.subType,
        updatedAt: 'updatedAt' in taskNode ? taskNode.updatedAt : undefined,
        thumbnail: mapSearchEntityThumbnail('thumbnail' in taskNode ? taskNode.thumbnail : undefined),
        thumbnailId:
          ('thumbnailId' in taskNode ? taskNode.thumbnailId : undefined) ??
          ('thumbnail' in taskNode ? taskNode.thumbnail?.id : undefined),
      }
    }
    case 'folder': {
      const folderNode = node as SearchedFolderNode | ExactFolderNode
      return {
        entityType: 'folder',
        id: folderNode.id,
        name: folderNode.name,
        label: folderNode.label || folderNode.name,
        parents: folderNode.parents || [],
        subType: folderNode.subType,
        thumbnail: mapSearchEntityThumbnail(
          'thumbnail' in folderNode ? folderNode.thumbnail : undefined,
        ),
        thumbnailId:
          ('thumbnailId' in folderNode ? folderNode.thumbnailId : undefined) ??
          ('thumbnail' in folderNode ? folderNode.thumbnail?.id : undefined),
      }
    }
    case 'product': {
      const productNode = node as SearchedProductNode | ExactProductNode
      const featuredVersion =
        'featuredVersion' in productNode ? productNode.featuredVersion : undefined
      return {
        entityType: 'product',
        id: productNode.id,
        name: productNode.name,
        label: productNode.name,
        parents: productNode.parents || [],
        subType: 'subType' in productNode ? productNode.subType : undefined,
        thumbnail: mapSearchEntityThumbnail(featuredVersion?.thumbnail),
        thumbnailId: featuredVersion?.thumbnailId || featuredVersion?.thumbnail?.id || undefined,
        targetEntityType: featuredVersion?.id ? 'version' : 'product',
        targetEntityId: featuredVersion?.id || productNode.id,
      }
    }
    case 'version': {
      const versionNode = node as SearchedVersionNode | ExactVersionNode
      return {
        entityType: 'version',
        id: versionNode.id,
        name: versionNode.name,
        label: versionNode.name,
        parents: versionNode.parents || [],
        updatedAt: 'updatedAt' in versionNode ? versionNode.updatedAt : undefined,
      }
    }
    case 'representation': {
      const representationNode = node as SearchedRepresentationNode
      return {
        entityType: 'representation',
        id: representationNode.id,
        name: representationNode.name,
        label: representationNode.name,
        parents: representationNode.parents || [],
      }
    }
    case 'workfile': {
      const workfileNode = node as SearchedWorkfileNode
      return {
        entityType: 'workfile',
        id: workfileNode.id,
        name: workfileNode.name,
        label: workfileNode.name,
        parents: workfileNode.parents || [],
      }
    }
    default:
      return null
  }
}

const getResolvedExactEntity = (
  resolvedUris: ResolvedUriModel[],
  projectName: string,
): { entityType: ExactEntityType; entityId: string } | null => {
  const matchedEntities = resolvedUris.flatMap((resolvedUri) =>
    (resolvedUri.entities || []).filter((entity) => {
      if (!entity.target || !exactEntityTypes.includes(entity.target)) {
        return false
      }

      if (entity.projectName && entity.projectName !== projectName) {
        return false
      }

      const entityId = entity[resolvedEntityIdKeyByType[entity.target]]
      return Boolean(entityId)
    }),
  )

  const deepestEntity = matchedEntities.sort(
    (left, right) => exactEntityPriority[right.target!] - exactEntityPriority[left.target!],
  )[0]

  if (!deepestEntity?.target) {
    return null
  }

  const entityId = deepestEntity[resolvedEntityIdKeyByType[deepestEntity.target]]
  return entityId ? { entityType: deepestEntity.target, entityId } : null
}

const getExactEntityNode = async (
  entityType: ExactEntityType,
  entityId: string,
  projectName: string,
  dispatch: any,
): Promise<ExactEntityNode | null> => {
  switch (entityType) {
    case 'task': {
      const result = await dispatch(
        gqlLinksApi.endpoints.GetTaskLinkData.initiate(
          { projectName, taskId: entityId },
          { forceRefetch: true },
        ),
      ).unwrap()
      return result?.project.task || null
    }
    case 'folder': {
      const result = await dispatch(
        gqlLinksApi.endpoints.GetFolderLinkData.initiate(
          { projectName, folderId: entityId },
          { forceRefetch: true },
        ),
      ).unwrap()
      return result?.project.folder || null
    }
    case 'product': {
      const result = await dispatch(
        gqlLinksApi.endpoints.GetProductLinkData.initiate(
          { projectName, productId: entityId },
          { forceRefetch: true },
        ),
      ).unwrap()
      return result?.project.product || null
    }
    case 'version': {
      const result = await dispatch(
        gqlLinksApi.endpoints.GetVersionLinkData.initiate(
          { projectName, versionId: entityId },
          { forceRefetch: true },
        ),
      ).unwrap()
      return result?.project.version || null
    }
  }
}

const injectedQueries = gqlLinksApi.injectEndpoints({
  endpoints: (build) => ({
    getExactEntityLinkData: build.query<SearchEntityLink | null, GetExactEntityLinkDataArgs>({
      queryFn: async ({ projectName, uri }, api) => {
        try {
          if (!uri.trim().toLowerCase().startsWith('ayon+entity://')) {
            return { data: null }
          }

          const resolvedUris = await api
            .dispatch(uRIsApi.endpoints.resolveUris.initiate({ resolveRequestModel: { uris: [uri] } }))
            .unwrap()

          const resolvedEntity = getResolvedExactEntity(resolvedUris, projectName)
          if (!resolvedEntity) {
            return { data: null }
          }

          const entityNode = await getExactEntityNode(
            resolvedEntity.entityType,
            resolvedEntity.entityId,
            projectName,
            api.dispatch,
          )

          return {
            data: entityNode
              ? mapEntityNodeToSearchEntityLink(resolvedEntity.entityType, entityNode)
              : null,
          }
        } catch (error: any) {
          console.warn('Error resolving exact entity link data:', error)
          return { data: null }
        }
      },
    }),
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
      providesTags: [{ type: 'linkSearchItem', id: 'LIST' }],
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
            ?.map(({ node }: any) => mapEntityNodeToSearchEntityLink(entityType, node))
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
      // Subscribe to link.created and link.deleted WebSocket events
      async onCacheEntryAdded(
        { projectName },
        { cacheDataLoaded, cacheEntryRemoved, dispatch },
      ) {
        let token: any

        try {
          await cacheDataLoaded

          const handlePubSub = async (_topic: string, message: any) => {
            // Only react to link.created and link.deleted events for this project
            if (!_topic.startsWith('link.created') && !_topic.startsWith('link.deleted')) return
            if (message?.project !== projectName) return

            // Link events have inputId and outputId in the summary
            const inputId = message?.summary?.inputId
            const outputId = message?.summary?.outputId
            if (!inputId && !outputId) return

            // Invalidate the search query cache when a link is created or deleted
            // This ensures the search results are fresh and don't show stale data
            dispatch(
              gqlLinksApi.util.invalidateTags([{ type: 'linkSearchItem', id: 'LIST' }]),
            )
          }

          // Subscribe to link events
          // NOTE: backend emits topics like 'link.created' and 'link.deleted'.
          // PubSub supports prefix matching when subscribing.
          token = PubSub.subscribe('link', handlePubSub)
        } catch (e) {
          // cache entry removed before loaded - ignore
        }

        await cacheEntryRemoved
        if (token) PubSub.unsubscribe(token)
      },
    }),
  }),
})

export const { useGetExactEntityLinkDataQuery, useGetSearchedEntitiesLinksInfiniteQuery } =
  injectedQueries
