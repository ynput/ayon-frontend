import { Button } from '@ynput/ayon-react-components'
import { FC, MouseEvent } from 'react'
import { useCreateContextMenu } from '@shared/containers/ContextMenu'
import {
  CSV_DELIMITERS,
  CsvDelimiter,
  useExportHierarchyCSV,
  useSelectionCellsContext,
} from '@shared/containers/ProjectTreeTable'
import { useProjectFoldersContext } from '@shared/context'
import { useProjectOverviewContext } from '../context/project-overview'

// Exports the rows of the current view (filters and slicer) as if every folder was
// expanded, with the visible columns in their order
const ExportTableButton: FC = () => {
  const {
    projectName,
    foldersMap,
    taskFilters,
    folderFilters,
    selectedFolders,
    selectedTaskIds,
    showHierarchy,
    isFlatFolderView,
  } = useProjectOverviewContext()
  const { gridMap } = useSelectionCellsContext()
  const { getFolderIdsWithoutChildren } = useProjectFoldersContext()
  const exportHierarchyCSV = useExportHierarchyCSV()
  const [showMenu] = useCreateContextMenu([])

  const exportTable = (delimiter: CsvDelimiter) => {
    const columnIds = Array.from(gridMap.colIdToIndex.entries())
      .sort(([, a], [, b]) => a - b)
      .map(([id]) => id)

    exportHierarchyCSV({
      projectName,
      columnIds,
      // grouped and flat task views only show tasks
      folderIds: showHierarchy || isFlatFolderView ? Array.from(foldersMap.keys()) : undefined,
      tasks: {
        ids: selectedTaskIds.length ? selectedTaskIds : undefined,
        folderIds:
          !selectedTaskIds.length && selectedFolders.length
            ? getFolderIdsWithoutChildren(selectedFolders)
            : undefined,
        filter: taskFilters.filterString || undefined,
        folderFilter: folderFilters.filterString || undefined,
        search: taskFilters.search || undefined,
      },
      delimiter,
      scope: 'table',
    })
  }

  const handleClick = (e: MouseEvent<HTMLButtonElement>) =>
    showMenu(
      e,
      CSV_DELIMITERS.map(({ value, label }) => ({ label, command: () => exportTable(value) })),
    )

  return <Button icon="download" label="Export CSV" onClick={handleClick} />
}

export default ExportTableButton
