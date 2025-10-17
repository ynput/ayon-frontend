import { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit'
import getListsGqlApiInjected from '../entityLists/getLists'

interface RefetchFilteredListItemsArgs {
  dispatch: ThunkDispatch<any, any, UnknownAction>
  projectName: string
  listId: string
  updatedItemIds: string[]
  cacheEntry: any
}

/**
 * Refetches list items with the cache entry's specific filter and updates the cache.
 * This ensures that items are correctly filtered and removed if they no longer match.
 * Returns the fetched items for potential reuse.
 */
export const refetchFilteredListItems = async ({
  dispatch,
  projectName,
  listId,
  updatedItemIds,
  cacheEntry,
}: RefetchFilteredListItemsArgs): Promise<any[] | null> => {
  try {
    // Build query params for this specific cache's filters
    const queryParams: any = {
      projectName,
      listId,
      // Note: We can't filter by specific itemIds in the GraphQL query
      // So we fetch all items and filter client-side
    }

    if (cacheEntry.originalArgs?.filter) {
      queryParams.filter = cacheEntry.originalArgs.filter
    }

    if (cacheEntry.originalArgs?.sortBy) {
      queryParams.sortBy = cacheEntry.originalArgs.sortBy
    }

    if (cacheEntry.originalArgs?.desc) {
      queryParams.desc = cacheEntry.originalArgs.desc
    }

    // Fetch entities with this cache's filter - server will only return matching items
    const result = await dispatch(
      getListsGqlApiInjected.endpoints.GetListItems.initiate(queryParams as any, {
        forceRefetch: true,
      }),
    )

    if (!result.data?.items) return null

    const fetchedItems = result.data.items
    const fetchedItemsMap = new Map(fetchedItems.map((item) => [item.entityId, item]))

    // Update this specific cache entry with filtered results
    dispatch(
      getListsGqlApiInjected.util.updateQueryData(
        'getListItemsInfinite',
        cacheEntry.originalArgs,
        (draft) => {
          // For each updated item, find it in the pages and update/remove it
          for (const itemId of updatedItemIds) {
            const fetchedItem = fetchedItemsMap.get(itemId)

            // Search through all pages
            for (const page of draft.pages) {
              const itemIndex = page.items.findIndex((item) => item.entityId === itemId)

              if (itemIndex !== -1) {
                if (fetchedItem) {
                  // Server returned this item - it matches the filter
                  // Update with fresh data by replacing the object
                  page.items[itemIndex] = fetchedItem
                } else {
                  // Server didn't return this item - it no longer matches the filter
                  // Remove it from cache
                  page.items.splice(itemIndex, 1)
                }
                break // Found and handled, move to next item
              }
            }
          }
        },
      ),
    )

    return fetchedItems
  } catch (error) {
    console.error('Background list items refetch failed:', error)
    return null
  }
}
