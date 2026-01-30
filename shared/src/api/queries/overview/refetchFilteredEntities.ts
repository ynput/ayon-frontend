import { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit'
import getOverviewApi from './getOverview'
import { foldersQueries } from '@shared/api'
import { RootState } from '@reduxjs/toolkit/query'

interface RefetchTasksForCacheEntryArgs {
  dispatch: ThunkDispatch<any, any, UnknownAction>
  projectName: string
  updatedTaskIds: string[]
  cacheEntry: any
}

/**
 * Refetches tasks with the cache entry's specific filter and updates the cache.
 * This ensures that tasks are correctly filtered and updated with fresh data from the server.
 * Returns the fetched tasks for potential reuse.
 */
export const refetchTasksForCacheEntry = async ({
  dispatch,
  projectName,
  updatedTaskIds,
  cacheEntry,
}: RefetchTasksForCacheEntryArgs): Promise<any[] | null> => {
  try {
    // Build query params for this specific cache's filters
    const queryParams: any = {
      projectName,
      taskIds: updatedTaskIds,
    }

    if (cacheEntry.originalArgs?.filter) {
      queryParams.filter = cacheEntry.originalArgs.filter
    }

    if (cacheEntry.originalArgs?.folderIds) {
      queryParams.folderIds = cacheEntry.originalArgs.folderIds
    }

    // Fetch entities with this cache's filter - server will only return matching tasks
    const result = await dispatch(
      getOverviewApi.endpoints.GetTasksList.initiate(queryParams as any, { forceRefetch: true })
    )

    if (!result.data?.tasks) return null

    const fetchedTasks = result.data.tasks
    const fetchedTasksMap = new Map(fetchedTasks.map((t) => [t.id, t]))

    // Update this specific cache entry with filtered results
    dispatch(
      getOverviewApi.util.updateQueryData(
        'getTasksListInfinite',
        cacheEntry.originalArgs,
        (draft) => {
          // For each updated task, find it across all pages and update it
          for (const taskId of updatedTaskIds) {
            const fetchedTask = fetchedTasksMap.get(taskId)

            // Search for this task in all pages
            for (const page of draft.pages) {
              const taskIndex = page.tasks.findIndex((t) => t.id === taskId)

              if (taskIndex !== -1) {
                if (fetchedTask) {
                  // Server returned this task - it matches the filter
                  // Update with fresh data by replacing the object
                  page.tasks[taskIndex] = fetchedTask
                } else {
                  // Server didn't return this task - it no longer matches the filter
                  // Remove it from cache
                  page.tasks.splice(taskIndex, 1)
                }
                break // Found the task, move to next taskId
              }
            }
          }
        }
      )
    )

    return fetchedTasks
  } catch (error) {
    console.error('Background entity refetch failed:', error)
    return null
  }
}

interface RefetchOverviewTasksForCacheEntryArgs {
  dispatch: ThunkDispatch<any, any, UnknownAction>
  projectName: string
  updatedTaskIds: string[]
  cacheEntry: any
}

/**
 * Refetches overview tasks with the cache entry's specific filter and updates the cache.
 * This ensures that tasks are correctly filtered and removed if they no longer match.
 * Returns the fetched tasks for potential reuse.
 */
export const refetchOverviewTasksForCacheEntry = async ({
  dispatch,
  projectName,
  updatedTaskIds,
  cacheEntry,
}: RefetchOverviewTasksForCacheEntryArgs): Promise<any[] | null> => {
  try {
    // Build query params for this specific cache's filters
    const queryParams: any = {
      projectName,
      taskIds: updatedTaskIds,
    }

    if (cacheEntry.originalArgs?.filter) {
      queryParams.filter = cacheEntry.originalArgs.filter
    }

    if (cacheEntry.originalArgs?.parentIds) {
      queryParams.parentIds = cacheEntry.originalArgs.parentIds
    }

    // Fetch entities with this cache's filter - server will only return matching tasks
    const result = await dispatch(
      getOverviewApi.endpoints.GetTasksList.initiate(queryParams as any, { forceRefetch: true })
    )

    if (!result.data?.tasks) return null

    const fetchedTasks = result.data.tasks
    const fetchedTasksMap = new Map(fetchedTasks.map((t) => [t.id, t]))

    // Update this specific cache entry with filtered results
    dispatch(
      getOverviewApi.util.updateQueryData(
        'getOverviewTasksByFolders',
        cacheEntry.originalArgs,
        (draft) => {
          // For each updated task, find it in the array and update/remove it
          for (const taskId of updatedTaskIds) {
            const fetchedTask = fetchedTasksMap.get(taskId)
            const taskIndex = draft.findIndex((t) => t.id === taskId)

            if (taskIndex !== -1) {
              if (fetchedTask) {
                // Server returned this task - it matches the filter
                // Update with fresh data by replacing the object
                draft[taskIndex] = fetchedTask
              } else {
                // Server didn't return this task - it no longer matches the filter
                // Remove it from cache
                draft.splice(taskIndex, 1)
              }
            }
          }
        }
      )
    )

    return fetchedTasks
  } catch (error) {
    console.error('Background overview tasks refetch failed:', error)
    return null
  }
}

interface RefetchFoldersArgs {
  dispatch: ThunkDispatch<any, any, UnknownAction>
  getState: () => RootState<any, any, 'restApi'>
  projectName: string
  updatedFolderIds: string[]
}

/**
 * Refetches folders and updates the cache with fresh data.
 * Preserves ownAttrib from the current cache if the fetched data has fewer fields
 * (handles race condition where server hasn't fully committed ownAttrib update).
 */
export const refetchFoldersAndUpdateCache = async ({
  dispatch,
  getState,
  projectName,
  updatedFolderIds,
}: RefetchFoldersArgs): Promise<void> => {
  try {
    // Get the current folder cache entries
    const state = getState()
    const folderTags = updatedFolderIds.map((id) => ({ type: 'folder', id }))
    const folderEntries = foldersQueries.util
      .selectInvalidatedBy(state, folderTags)
      .filter((entry) => entry.endpointName === 'getFolderList')

    if (folderEntries.length === 0) return

    // Store current ownAttrib values for ALL folders before refetch (not just updated ones)
    // This is critical because forceRefetch overwrites the entire cache
    const currentOwnAttribMap = new Map<string, string[]>()
    for (const entry of folderEntries) {
      const cacheData = foldersQueries.endpoints.getFolderList.select(entry.originalArgs)(state)
      if (cacheData?.data?.folders) {
        // Capture ownAttrib for ALL folders in the cache
        for (const folder of cacheData.data.folders) {
          if (folder?.ownAttrib && folder.ownAttrib.length > 0) {
            currentOwnAttribMap.set(folder.id, [...folder.ownAttrib])
          }
        }
      }
    }
    // Fetch fresh folder data
    for (const entry of folderEntries) {
      const result = await dispatch(
        foldersQueries.endpoints.getFolderList.initiate(entry.originalArgs, { forceRefetch: true })
      )

      if (!result.data?.folders) continue

      // Update cache with fetched data, preserving ownAttrib additions for ALL folders
      dispatch(
        foldersQueries.util.updateQueryData('getFolderList', entry.originalArgs, (draft) => {
          // Process ALL folders in the draft, not just updatedFolderIds
          for (let i = 0; i < draft.folders.length; i++) {
            const draftFolder = draft.folders[i]
            const fetchedFolder = result.data!.folders.find((f: any) => f.id === draftFolder.id)

            if (fetchedFolder) {
              const currentOwnAttrib = currentOwnAttribMap.get(draftFolder.id) || []
              const fetchedOwnAttrib = fetchedFolder.ownAttrib || []

              // Preserve ownAttrib additions from optimistic update
              // If current has fields not in fetched, merge them (handles race condition)
              const additionalFields = currentOwnAttrib.filter(
                (f: string) => !fetchedOwnAttrib.includes(f)
              )

              // Create a new folder object to avoid mutating the frozen API response
              const mergedFolder = {
                ...fetchedFolder,
                ownAttrib: additionalFields.length > 0
                  ? [...new Set([...fetchedOwnAttrib, ...additionalFields])]
                  : fetchedOwnAttrib,
              }

              draft.folders[i] = mergedFolder
            }
          }
        })
      )
    }
  } catch (error) {
    console.error('Background folder refetch failed:', error)
  }
}
