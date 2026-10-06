import { useCallback } from 'react'
import { toast } from 'react-toastify'
import { useExportHierarchyViewMutation, useLazyExportFieldsQuery } from '@shared/api'
import type { ExportTasksQuery } from '@shared/api/generated/dataImport'
import { getRequestErrorString } from '@shared/util'
import {
  CsvDelimiter,
  downloadTextFile,
  getCsvFileName,
  getExportColumnKeys,
} from '../utils/csvExport'

export type ExportHierarchyCSVArgs = {
  projectName: string
  columnIds: string[] // table column ids in display order
  folderIds?: string[] // folder rows
  tasks?: ExportTasksQuery // task rows
  delimiter: CsvDelimiter
  scope: 'selection' | 'table' // used in the file name
}

// Folders and tasks are exported by the server, so the file has every row and inherited
// attribute the user can read, also ones the table has not loaded yet
export const useExportHierarchyCSV = () => {
  const [getExportFields] = useLazyExportFieldsQuery()
  const [exportHierarchyView] = useExportHierarchyViewMutation()

  return useCallback(
    async ({
      projectName,
      columnIds,
      folderIds,
      tasks,
      delimiter,
      scope,
    }: ExportHierarchyCSVArgs) => {
      const toastId = toast.loading('Exporting CSV...', { autoClose: false })
      try {
        const fields = await getExportFields(
          { entityType: 'hierarchy', projectName },
          true,
        ).unwrap()
        const exportable = new Set(fields.map((field) => field.key))
        const csv = await exportHierarchyView({
          projectName,
          exportViewRequest: {
            columns: getExportColumnKeys(columnIds).filter((key) => exportable.has(key)),
            folderIds,
            tasks,
            delimiter,
          },
        }).unwrap()

        const fileName = getCsvFileName(projectName, scope, delimiter)
        downloadTextFile(
          csv,
          fileName,
          delimiter === '\t' ? 'text/tab-separated-values' : 'text/csv',
        )
        toast.dismiss(toastId)
      } catch (error) {
        toast.update(toastId, {
          render: `Export failed: ${getRequestErrorString(error)}`,
          type: 'error',
          autoClose: 5000,
          isLoading: false,
        })
      }
    },
    [getExportFields, exportHierarchyView],
  )
}
