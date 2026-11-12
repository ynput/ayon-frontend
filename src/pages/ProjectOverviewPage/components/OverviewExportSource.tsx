import { FC } from 'react'
import { TableExportSource } from '@shared/containers/TableExport'
import type { TableExportRows, TableExportScope } from '@shared/context'
import {
  getTasksSortArgs,
  useColumnSettingsContext,
  useProjectTableContext,
} from '@shared/containers/ProjectTreeTable'
import { useProjectFoldersContext } from '@shared/context'
import { getForwardSortBy } from '@shared/util'
import { useProjectOverviewContext } from '../context/project-overview'

// The whole table is exported as if every folder was expanded, with the view's filters
const OverviewExportSource: FC = () => {
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
  const { sorting } = useColumnSettingsContext()
  const { getFolderIdsWithoutChildren } = useProjectFoldersContext()
  const { getEntityById } = useProjectTableContext()

  // grouped and flat task views only show tasks, in the table's sort order
  const isTaskList = !showHierarchy && !isFlatFolderView
  // without a sort, the server puts tasks in the tree with their folders
  const sortBy = isTaskList ? getForwardSortBy(getTasksSortArgs(sorting, false)) : undefined

  const getRows = (scope: TableExportScope, selectedRowIds: string[]): TableExportRows => {
    if (scope === 'selection') {
      const entities = selectedRowIds.flatMap((id) => getEntityById(id) || [])
      const idsOf = (type: string) =>
        entities.filter((e) => e.entityType === type).map((e) => e.entityId || e.id)
      return { folderIds: idsOf('folder'), tasks: { ids: idsOf('task'), sortBy } }
    }
    return {
      folderIds: isTaskList ? undefined : Array.from(foldersMap.keys()),
      tasks: {
        sortBy,
        ids: selectedTaskIds.length ? selectedTaskIds : undefined,
        folderIds:
          !selectedTaskIds.length && selectedFolders.length
            ? getFolderIdsWithoutChildren(selectedFolders)
            : undefined,
        filter: taskFilters.filterString || undefined,
        folderFilter: folderFilters.filterString || undefined,
        search: taskFilters.search || undefined,
      },
    }
  }

  return (
    <TableExportSource
      projectName={projectName}
      subTypeKey="folder_or_task_type"
      canImport
      getRows={getRows}
    />
  )
}

export default OverviewExportSource
