import { useState } from 'react'
import { useLazyGetTasksByParentQuery } from '@queries/overview/getOverview'
import { parseCellId } from '../utils/cellUtils'
import { useProjectTableContext } from '@shared/ProjectTreeTable'

export const usePrefetchFolderTasks = () => {
  const [fetchFolderTasks] = useLazyGetTasksByParentQuery()
  const [prefetchedIds, setPrefetchedIds] = useState<string[]>([])

  const { projectName, queryFilters } = useProjectTableContext()

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

    fetchFolderTasks(
      {
        projectName,
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
