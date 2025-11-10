import { useState } from 'react'
import { parseCellId } from '../utils/cellUtils'
import { useProjectTableQueriesContext } from '../context/ProjectTableQueriesContext'
import { useProjectTableContext } from '../context/ProjectTableContext'

export const usePrefetchFolderTasks = () => {
  const { getFoldersTasks } = useProjectTableQueriesContext()

  const [prefetchedIds, setPrefetchedIds] = useState<string[]>([])

  const { queryFilters } = useProjectTableContext()

  const handlePreFetchTasks = (e: React.MouseEvent<HTMLTableSectionElement>) => {
    const target = e.target as HTMLTableCellElement
    // hovering the expander and td?
    const td = target.closest('td')
    if (!target.closest('.expander') || !td) return
    // first div child of td id
    const cell = td.firstElementChild as HTMLDivElement
    const cellId = cell?.id
    if (!cellId) return
    // cell colId is name
    const { colId, rowId } = parseCellId(cellId) || {}
    if (colId !== 'name' || !rowId) return
    // check if the cell is a folder (classname contains folder)
    const isFolder = cell.className.includes('folder')
    if (!isFolder) return

    // check if the rowId is already in the prefetchedIds
    if (prefetchedIds.includes(rowId)) return
    setPrefetchedIds((prev) => [...prev, rowId])

    getFoldersTasks(
      {
        parentIds: [rowId],
        filter: queryFilters.filterString,
        search: queryFilters.search,
      },
      true,
    )
  }

  return { handlePreFetchTasks }
}

export default usePrefetchFolderTasks
