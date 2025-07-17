import { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { GetFoldersLinksQuery, gqlApi, foldersApi } from '@shared/api/generated'

/**
 * Custom queryFn for fetching folder links with optimized caching behavior.
 *
 * Key features:
 * 1. Single cache per project - different folderIds combinations don't create new caches
 * 2. Skips fetching folders that are already cached
 * 3. Force refetch when folderIds change
 * 4. Merges new folders into cache without duplicates
 */

// Define the arguments for the query
export type GetFoldersLinksArgs = {
  projectName: string
  folderIds: string[]
}

export type FolderLink =
  GetFoldersLinksQuery['project']['folders']['edges'][0]['node']['links']['edges'][0]

// Define the result type for the query - this matches what the GraphQL query returns
export type FolderWithLinks = {
  id: string
  links: { edges: FolderLink[] }
}

export type GetFoldersLinksResult = FolderWithLinks[]

const injectedQueries = foldersApi.injectEndpoints({
  endpoints: (build) => ({
    getFoldersLinks: build.query<GetFoldersLinksResult, GetFoldersLinksArgs>({
      queryFn: async (
        { projectName, folderIds },
        { getState, dispatch, queryCacheKey, forced },
      ) => {
        try {
          // Get current state to access cached data
          const state = getState() as any
          const cacheKey = JSON.stringify({ projectName })

          // Access the cache entry for this project
          const cacheEntry =
            state.restApi?.queries?.[queryCacheKey || `getFoldersLinks(${cacheKey})`]
          const cachedData = cacheEntry?.data || []

          // 1. When fetching new data for folderIds, we should skip folders that are already in the cache.
          const cachedFolderIds = new Set(cachedData.map((folder: FolderWithLinks) => folder.id))
          const folderIdsToFetch = folderIds.filter((id) => !cachedFolderIds?.has(id) || forced)

          console.log('folderIdsToFetch', { folderIds, folderIdsToFetch })

          // If all folders are already cached, return the cached data
          if (folderIdsToFetch.length === 0) {
            return { data: cachedData }
          }

          // Fetch only the folders that aren't already cached
          const result = await dispatch(
            gqlApi.endpoints.GetFoldersLinks.initiate(
              { projectName, folderIds: folderIdsToFetch },
              { forceRefetch: true },
            ),
          ).unwrap()

          const newFolders =
            result.project?.folders?.edges?.map(({ node }) => ({
              id: node.id,
              links: node.links,
            })) || []

          // Return the new folders - the merge function will handle combining with existing cache
          return { data: newFolders }
        } catch (error: any) {
          console.error('Error in getFoldersLinks queryFn:', error)
          return { error: { status: 'FETCH_ERROR', error: error.message } as FetchBaseQueryError }
        }
      },
      // 2. We should not create new caches when the folderIds argument changes.
      serializeQueryArgs: ({ queryArgs }) => {
        // Use only projectName for the cache key, ignoring folderIds
        return { projectName: queryArgs.projectName }
      },
      // 3. We should force a refetch every time the folderIds changes.
      forceRefetch: ({ currentArg, previousArg }) => {
        // Force refetch if folderIds array is different
        if (!currentArg || !previousArg) return true

        // Compare arrays by converting to sets
        const currentIds = new Set(currentArg.folderIds)
        const previousIds = new Set(previousArg.folderIds)

        if (currentIds.size !== previousIds.size) return true

        // Check if any IDs are different
        for (const id of currentIds) {
          if (!previousIds.has(id)) return true
        }

        return false
      },
      // 4. We should merge new folders into the cache ensuring there are no duplicates.
      merge: (currentCache, newItems) => {
        if (!currentCache) return newItems

        const cacheMap = new Map(currentCache.map((item) => [item.id, item]))
        for (const newItem of newItems) {
          cacheMap.set(newItem.id, newItem) // Overwrite if exists, add if not
        }
        // Update currentCache in-place
        currentCache.length = 0
        currentCache.push(...cacheMap.values())
      },
      // Provide tags for potential invalidation
      providesTags: (result, error, arg) =>
        result
          ? [
              ...result.map((folder) => ({ type: 'Folder' as const, id: folder.id })),
              { type: 'Folder', id: `PROJECT_${arg.projectName}` },
            ]
          : [{ type: 'Folder', id: `PROJECT_${arg.projectName}` }],
    }),
  }),
})

export const { useGetFoldersLinksQuery } = injectedQueries
