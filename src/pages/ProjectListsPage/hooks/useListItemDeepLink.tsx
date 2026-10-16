// Selects and scrolls to the list items named by `listItemId` URL params, e.g.
// /projects/<project>/lists?list=<listId>&listItemId=<itemId>&listItemId=<itemId>
// The params are moved into state as soon as they are read, so a reload or the user's
// own selection afterwards is never overridden, and switching lists doesn't carry them over.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Button } from '@ynput/ayon-react-components'
import {
  getCellId,
  parseCellId,
  ROW_SELECTION_COLUMN_ID,
  useSelectionCellsContext,
} from '@shared/containers/ProjectTreeTable'
import { useListItemsDataContext } from '../context/list-items-data'
import { useListsContext } from '../context'

export const LIST_ITEM_ID_PARAM = 'listItemId'

type PendingDeepLink = {
  ids: string[]
  listId: string
  // after clearing filters: the filters the items were not found with, wait until they change
  staleFilters?: string
}

const useListItemDeepLink = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { isReview, selectedList } = useListsContext()
  const {
    listItemsData,
    listItemsMap,
    isLoadingAll,
    isUninitialized,
    isFetching,
    isError,
    hasNextPage,
    fetchNextPage,
    listItemsFilters,
    resetFilters,
  } = useListItemsDataContext()
  const { setSelectedCells, setFocusedCellId, setAnchorCell } = useSelectionCellsContext()

  const [pending, setPending] = useState<PendingDeepLink | null>(null)
  const [scrollToRowId, setScrollToRowId] = useState<string | null>(null)

  const listParam = isReview ? 'review' : 'list'
  const urlListId = searchParams.get(listParam)
  const urlItemIds = searchParams.getAll(LIST_ITEM_ID_PARAM).join(',')
  const filtersKey = useMemo(() => JSON.stringify(listItemsFilters), [listItemsFilters])

  // read the params once and remove them from the url
  useEffect(() => {
    if (!urlItemIds) return
    setPending(
      urlListId ? { ids: Array.from(new Set(urlItemIds.split(','))), listId: urlListId } : null,
    )
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete(LIST_ITEM_ID_PARAM)
        return next
      },
      { replace: true },
    )
  }, [urlItemIds])

  useEffect(() => {
    if (!pending) return
    // the user switched to another list
    if (urlListId !== pending.listId) return setPending(null)
    if (selectedList?.id !== pending.listId || isUninitialized) return
    // isLoadingAll turns on a render after the filters change, isFetching right away
    if (isLoadingAll || isFetching) return
    if (pending.staleFilters === filtersKey) return
    if (isError) return setPending(null)

    const missingIds = pending.ids.filter((id) => !listItemsMap.has(id))
    // items can be on pages that are not loaded yet
    if (missingIds.length && hasNextPage) {
      fetchNextPage()
      return
    }

    setPending(null)

    const foundIds = new Set(pending.ids.filter((id) => listItemsMap.has(id)))
    const firstId = listItemsData.find((item) => foundIds.has(item.id))?.id
    if (firstId) {
      const firstCellId = getCellId(firstId, ROW_SELECTION_COLUMN_ID)
      setSelectedCells(new Set([...foundIds].map((id) => getCellId(id, ROW_SELECTION_COLUMN_ID))))
      setFocusedCellId(firstCellId)
      setAnchorCell(parseCellId(firstCellId))
      setScrollToRowId(firstId)
    }

    if (!missingIds.length) return
    const count =
      missingIds.length === 1 ? '1 linked item is' : `${missingIds.length} linked items are`
    if (!listItemsFilters.conditions?.length) {
      toast.warning(`${count} no longer in this list.`)
      return
    }

    // the saved view's filters or search may hide the items: offer to clear them and try again
    const toastId = toast.warning(
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>
          {count} not shown. The current filters may hide {missingIds.length === 1 ? 'it' : 'them'}.
        </span>
        <Button
          label="Clear filters"
          onClick={() => {
            toast.dismiss(toastId)
            setPending({ ...pending, staleFilters: filtersKey })
            resetFilters()
          }}
        />
      </div>,
      { autoClose: 10000 },
    )
  }, [
    pending,
    urlListId,
    selectedList?.id,
    isUninitialized,
    isLoadingAll,
    isFetching,
    isError,
    hasNextPage,
    listItemsMap,
    listItemsData,
    filtersKey,
  ])

  const onScrolledToRow = useCallback(() => setScrollToRowId(null), [])

  return { scrollToRowId, onScrolledToRow }
}

export default useListItemDeepLink
