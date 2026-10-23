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
import { useLazyGetListItemsQuery } from '@shared/api'
import { useProjectContext } from '@shared/context'
import { useListItemsDataContext } from '../context/list-items-data'
import { useListsContext } from '../context'

export const LIST_ITEM_ID_PARAM = 'listItemId'

type PendingDeepLink = {
  ids: string[]
  listId: string
  // after clearing filters: the filters the items were not found with, wait until they change
  staleFilters?: string
  // where the items are, from one query by id before any pages are loaded
  check?: {
    filter?: string
    search?: string
    visible: string[] // match the current filters, page until they are loaded
    hidden: string[] // in the list but hidden by the filters or search
    gone: string[] // not in the list
  }
}

const useListItemDeepLink = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { projectName } = useProjectContext()
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
    listItemsQuery,
    resetFilters,
  } = useListItemsDataContext()
  const { setSelectedCells, setFocusedCellId, setAnchorCell } = useSelectionCellsContext()
  const [getListItems] = useLazyGetListItemsQuery()

  const [pending, setPending] = useState<PendingDeepLink | null>(null)
  const [scrollToRowId, setScrollToRowId] = useState<string | null>(null)

  const listParam = isReview ? 'review' : 'list'
  const urlListId = searchParams.get(listParam)
  const urlItemIds = searchParams.getAll(LIST_ITEM_ID_PARAM).join(',')
  const filtersKey = useMemo(() => JSON.stringify(listItemsFilters), [listItemsFilters])
  const { filter: queryFilter, search: querySearch } = listItemsQuery

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

  // ask the server which items exist and match the filters, so missing items
  // don't load every page of the list before we can say they are missing
  const isCheckReady =
    !!pending &&
    !isUninitialized &&
    (!pending.check ||
      pending.check.filter !== queryFilter ||
      pending.check.search !== querySearch) &&
    urlListId === pending.listId &&
    selectedList?.id === pending.listId &&
    pending.staleFilters !== filtersKey
  useEffect(() => {
    if (!pending || !isCheckReady) return
    let cancelled = false
    const { ids, listId } = pending

    const findIds = async (filter?: string, search?: string) => {
      const conditions = [
        { key: 'id', operator: 'in', value: ids },
        ...(filter ? [JSON.parse(filter)] : []),
      ]
      const result = await getListItems({
        projectName,
        listId,
        filter: JSON.stringify({ operator: 'and', conditions }),
        search,
        first: ids.length,
      }).unwrap()
      return new Set(result.items.map((item) => item.id))
    }

    const check = async () => {
      try {
        const visible = await findIds(queryFilter, querySearch)
        const isFiltered = !!queryFilter || !!querySearch
        const existing = visible.size < ids.length && isFiltered ? await findIds() : visible
        return {
          filter: queryFilter,
          search: querySearch,
          visible: ids.filter((id) => visible.has(id)),
          hidden: ids.filter((id) => existing.has(id) && !visible.has(id)),
          gone: ids.filter((id) => !existing.has(id)),
        }
      } catch {
        // fall back to looking through the pages
        return { filter: queryFilter, search: querySearch, visible: ids, hidden: [], gone: [] }
      }
    }

    check().then((result) => {
      if (!cancelled)
        setPending((prev) => (prev === pending ? { ...pending, check: result } : prev))
    })
    return () => {
      cancelled = true
    }
  }, [pending, isCheckReady, projectName, queryFilter, querySearch])

  useEffect(() => {
    if (!pending) return
    // the user switched to another list
    if (urlListId !== pending.listId)
      return setPending((prev) => (prev === pending ? null : prev))
    if (
      !pending.check ||
      pending.check.filter !== queryFilter ||
      pending.check.search !== querySearch ||
      selectedList?.id !== pending.listId ||
      isUninitialized
    )
      return
    // isLoadingAll turns on a render after the filters change, isFetching right away
    if (isLoadingAll || isFetching) return
    if (isError) return setPending(null)

    const { visible, hidden, gone } = pending.check
    const notLoaded = visible.filter((id) => !listItemsMap.has(id))
    // the items can be on pages that are not loaded yet
    if (notLoaded.length && hasNextPage) {
      fetchNextPage()
      return
    }

    setPending(null)

    const foundIds = new Set(visible.filter((id) => listItemsMap.has(id)))
    const firstId = listItemsData.find((item) => foundIds.has(item.id))?.id
    if (firstId) {
      const firstCellId = getCellId(firstId, ROW_SELECTION_COLUMN_ID)
      setSelectedCells(new Set([...foundIds].map((id) => getCellId(id, ROW_SELECTION_COLUMN_ID))))
      setFocusedCellId(firstCellId)
      setAnchorCell(parseCellId(firstCellId))
      setScrollToRowId(firstId)
    }

    const countLabel = (count: number) =>
      count === 1 ? '1 linked item is' : `${count} linked items are`

    // removed since the check, or since the link was made
    const goneCount = gone.length + notLoaded.length
    if (goneCount) toast.warning(`${countLabel(goneCount)} no longer in this list.`)

    if (!hidden.length) return
    // the saved view's filters or search hide the items: offer to clear them and try again
    const toastId = toast.warning(
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>{countLabel(hidden.length)} hidden by the current filters.</span>
        <Button
          label="Clear filters"
          onClick={() => {
            toast.dismiss(toastId)
            setPending({ ids: pending.ids, listId: pending.listId, staleFilters: filtersKey })
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
    queryFilter,
    querySearch,
  ])

  const onScrolledToRow = useCallback(() => setScrollToRowId(null), [])

  return { scrollToRowId, onScrolledToRow }
}

export default useListItemDeepLink
