import { FC } from 'react'
import {
  TableExportDialogHost,
  TableExportRows,
  TableExportScope,
} from '@shared/containers/TableExport'
import { useProjectTableContext } from '@shared/containers/ProjectTreeTable'
import { useProjectFoldersContext } from '@shared/context'
import { useProjectOverviewContext } from '../context/project-overview'

// The whole table is exported as if every folder was expanded, with the view's filters
const OverviewExportDialog: FC = () => {
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
  const { getFolderIdsWithoutChildren } = useProjectFoldersContext()
  const { getEntityById } = useProjectTableContext()

  const getRows = (scope: TableExportScope, selectedRowIds: string[]): TableExportRows => {
    if (scope === 'selection') {
      const entities = selectedRowIds.flatMap((id) => getEntityById(id) || [])
      const idsOf = (type: string) =>
        entities.filter((e) => e.entityType === type).map((e) => e.entityId || e.id)
      return { folderIds: idsOf('folder'), tasks: { ids: idsOf('task') } }
    }
    return {
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
    }
  }

  return (
    <TableExportDialogHost
      projectName={projectName}
      subTypeKey="folder_or_task_type"
      canImport
      getRows={getRows}
    />
  )
}

export default OverviewExportDialog
