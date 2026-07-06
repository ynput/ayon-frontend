import { useCallback } from 'react'
import { entityListsQueriesGql } from '@shared/api/queries/entityLists'
import { useAppDispatch } from '@state/store'
import store from '@state/store'

export type Clip = { listItemId: string }
export type PatchActionType = 'add' | 'delete' | 'reorder' | 'update' | 'replace'

type PatchProps = {
  listId: string
}

export default function usePatchListsCaches({ listId }: PatchProps) {
  const dispatch = useAppDispatch()

  const patchListsCaches = useCallback(
    (clips: Clip[], type: PatchActionType) => {
      if (!listId) return

      const state = store.getState()

      // --- Patch getListItemsInfinite cache ---
      if (type === 'delete' || type === 'reorder') {
        const listItemTags = [{ type: 'entityListItem', id: listId }]
        const itemInfiniteEntries = entityListsQueriesGql.util
          .selectInvalidatedBy(state as any, listItemTags)
          .filter((e) => e.endpointName === 'getListItemsInfinite')

        for (const entry of itemInfiniteEntries) {
          dispatch(
            entityListsQueriesGql.util.updateQueryData(
              'getListItemsInfinite',
              entry.originalArgs as any,
              (draft) => {
                if (type === 'delete') {
                  const nonDeletedIds = new Set(clips.map((c) => c.listItemId))
                  draft.pages.forEach((page) => {
                    page.items = page.items.filter((item) => nonDeletedIds.has(item.id))
                  })
                } else if (type === 'reorder') {
                  // Build an order map from the clips array (clips are in the new desired order)
                  const orderMap = new Map(clips.map((c, i) => [c.listItemId, i]))
                  // Gather all items and sort them by their new position
                  const allItems = draft.pages.flatMap((page) => page.items)
                  allItems.sort((a, b) => {
                    const posA = orderMap.has(a.id) ? orderMap.get(a.id)! : Infinity
                    const posB = orderMap.has(b.id) ? orderMap.get(b.id)! : Infinity
                    return posA - posB
                  })
                  // Re-distribute sorted items back into pages, maintaining original page sizes
                  let idx = 0
                  for (const page of draft.pages) {
                    const size = page.items.length
                    page.items = allItems.slice(idx, idx + size)
                    idx += size
                  }
                }
              },
            ),
          )
        }
      }

      // --- Patch getListsInfinite cache (item count) ---
      if (type === 'delete' || type === 'add') {
        const listTags = [{ type: 'entityList', id: listId }]
        const listInfiniteEntries = entityListsQueriesGql.util
          .selectInvalidatedBy(state as any, listTags)
          .filter((e) => e.endpointName === 'getListsInfinite')

        for (const entry of listInfiniteEntries) {
          dispatch(
            entityListsQueriesGql.util.updateQueryData(
              'getListsInfinite',
              entry.originalArgs as any,
              (draft) => {
                for (const page of draft.pages) {
                  const list = page.lists.find((l) => l.id === listId)
                  if (!list) continue
                  list.count = clips.length
                }
              },
            ),
          )
        }
      }
    },
    [dispatch, listId],
  )

  return patchListsCaches
}
