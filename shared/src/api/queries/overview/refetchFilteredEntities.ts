import { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit'
import getOverviewApi from './getOverview'

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