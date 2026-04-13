import { useMemo } from 'react'
import type { SearchEntityLink } from '@shared/api'
import {
  useGetExactEntityLinkDataQuery,
  useGetProjectAnatomyQuery,
  useGetSearchedEntitiesLinksInfiniteQuery,
} from '@shared/api'
import {
  buildGlobalSearchResult,
  isEntityUriSearch,
  isGlobalSearchEntityType,
  isUsableGlobalSearch,
  rankGlobalSearchResults,
  sanitizeGlobalSearchLimit,
  type GlobalSearchEntity,
} from './searchUtils'
import type {
  GlobalSearchEntityType,
  GlobalSearchResult,
  UseGlobalProjectSearchArgs,
  UseGlobalProjectSearchResult,
} from './types'

export type { GlobalSearchResult } from './types'

const getFirstPageEntities = (data?: { pages?: Array<{ entities: SearchEntityLink[] }> }) =>
  data?.pages?.[0]?.entities || []

const isGlobalSearchEntity = (entity: SearchEntityLink): entity is GlobalSearchEntity =>
  isGlobalSearchEntityType(entity.entityType)

export const useGlobalProjectSearch = ({
  projectName,
  search,
  limit,
}: UseGlobalProjectSearchArgs): UseGlobalProjectSearchResult => {
  const trimmedProjectName = projectName?.trim()
  const trimmedSearch = search.trim()
  const canSearch = isUsableGlobalSearch(trimmedProjectName, trimmedSearch)
  const { data: anatomy = {} } = useGetProjectAnatomyQuery(
    { projectName: trimmedProjectName || '' },
    { skip: !trimmedProjectName },
  )

  const buildQueryArgs = (entityType: GlobalSearchEntityType) => ({
    projectName: trimmedProjectName || '',
    entityType,
    search: trimmedSearch,
  })
  const shouldResolveExactUri = canSearch && isEntityUriSearch(trimmedSearch)

  const folderQuery = useGetSearchedEntitiesLinksInfiniteQuery(buildQueryArgs('folder'), {
    skip: !canSearch,
  })
  const taskQuery = useGetSearchedEntitiesLinksInfiniteQuery(buildQueryArgs('task'), {
    skip: !canSearch,
  })
  const productQuery = useGetSearchedEntitiesLinksInfiniteQuery(buildQueryArgs('product'), {
    skip: !canSearch,
  })
  const exactEntityQuery = useGetExactEntityLinkDataQuery(
    { projectName: trimmedProjectName || '', uri: trimmedSearch },
    { skip: !shouldResolveExactUri },
  )

  const results = useMemo(() => {
    if (!canSearch || !trimmedProjectName) return []

    const entities = [
      ...getFirstPageEntities(folderQuery.data),
      ...getFirstPageEntities(taskQuery.data),
      ...getFirstPageEntities(productQuery.data),
    ].filter(isGlobalSearchEntity)

    const rankedResults = rankGlobalSearchResults({
      entities,
      projectName: trimmedProjectName,
      search: trimmedSearch,
      limit,
      anatomy,
    })

    const exactEntity = shouldResolveExactUri ? exactEntityQuery.currentData : undefined
    if (!exactEntity || !isGlobalSearchEntity(exactEntity)) {
      return rankedResults
    }

    const duplicateEntity = entities.find(
      ({ id, entityType }) => id === exactEntity.id && entityType === exactEntity.entityType,
    )

    const mergedExactEntity: GlobalSearchEntity = {
      ...duplicateEntity,
      ...exactEntity,
      label: exactEntity.label || duplicateEntity?.label || exactEntity.name,
      parents: exactEntity.parents?.length ? exactEntity.parents : duplicateEntity?.parents || [],
      subType: exactEntity.subType || duplicateEntity?.subType,
      updatedAt: exactEntity.updatedAt || duplicateEntity?.updatedAt,
      thumbnail: exactEntity.thumbnail || duplicateEntity?.thumbnail,
      thumbnailId: exactEntity.thumbnailId || duplicateEntity?.thumbnailId,
    }

    const exactResult = {
      ...buildGlobalSearchResult({
        entity: mergedExactEntity,
        projectName: trimmedProjectName,
        search: trimmedSearch,
        anatomy,
      }),
      score: Number.MAX_SAFE_INTEGER,
    }

    const dedupedRankedResults = rankedResults.filter(
      ({ id, entityType }) => id !== exactResult.id || entityType !== exactResult.entityType,
    )

    return [exactResult, ...dedupedRankedResults].slice(0, sanitizeGlobalSearchLimit(limit))
  }, [
      anatomy,
      canSearch,
      exactEntityQuery.currentData,
      folderQuery.data,
      limit,
      productQuery.data,
      shouldResolveExactUri,
      taskQuery.data,
      trimmedProjectName,
      trimmedSearch,
  ])

  return {
    results,
    isLoading:
      canSearch &&
      (folderQuery.isLoading ||
        taskQuery.isLoading ||
        productQuery.isLoading ||
        exactEntityQuery.isLoading),
    isFetching:
      canSearch &&
      (folderQuery.isFetching ||
        taskQuery.isFetching ||
        productQuery.isFetching ||
        exactEntityQuery.isFetching),
  }
}

export default useGlobalProjectSearch
