import { FC } from 'react'
import {
  TableExportDialogHost,
  TableExportRows,
  TableExportScope,
} from '@shared/containers/TableExport'
import { useProjectContext } from '@shared/context'
import { useListsContext } from '../context'
import { useListItemsDataContext } from '../context/list-items-data'

// Exports list items with the list's filter and order. Table rows are list item ids.
const ListExportDialog: FC = () => {
  const { projectName } = useProjectContext()
  const { selectedList } = useListsContext()
  const { listItemsQueryArgs } = useListItemsDataContext()

  if (!selectedList) return null
  const { filter, search, sortBy, desc } = listItemsQueryArgs

  const getRows = (scope: TableExportScope, selectedRowIds: string[]): TableExportRows => ({
    entityList:
      scope === 'selection'
        ? { id: selectedList.id, itemIds: selectedRowIds }
        : {
            id: selectedList.id,
            filter,
            search: search || undefined,
            sortBy: sortBy ? [`${desc ? '-' : ''}${sortBy}`] : undefined,
          },
  })

  return (
    <TableExportDialogHost
      projectName={projectName}
      subTypeKey={
        ['folder', 'task'].includes(selectedList.entityType)
          ? 'folder_or_task_type'
          : 'product_type'
      }
      getRows={getRows}
    />
  )
}

export default ListExportDialog
