import { FC, useCallback, useMemo } from 'react'
import { useColumnSettingsContext } from '../ProjectTreeTable/context/column-settings'
import { useSelectionCellsContext } from '../ProjectTreeTable/context/selection-cells'
import { useProjectTableContext } from '../ProjectTreeTable/context/project-table'
import { parseCellId } from '../ProjectTreeTable/utils/cellUtils'
import { ROW_SELECTION_COLUMN_ID } from '../ProjectTreeTable/constants'
import { GROUP_BY_ID } from '../ProjectTreeTable/hooks/useBuildGroupByTableData'
import { TableExportDialog } from './TableExportDialog'
import { useTableExportContext } from './TableExportContextInstance'
import { TableExportContent, useTableExport } from './useTableExport'
import {
  getExportColumnKey,
  getExportColumnLabel,
  getVisibleColumnIds,
  SubTypeKey,
} from './tableExportColumns'
import type { TableExportScope, TableExportSettings } from './tableExportSettings'

export type TableExportRows = Pick<
  TableExportContent,
  'folderIds' | 'tasks' | 'products' | 'versions' | 'entityList'
>

export type TableExportDialogHostProps = {
  projectName: string
  subTypeKey: SubTypeKey
  canImport?: boolean // the rows can be imported back with Import CSV
  // the rows to export: the whole table, or the selected table rows
  getRows: (scope: TableExportScope, selectedRowIds: string[]) => TableExportRows
}

const IMPORT_COLUMNS = ['entity_type', 'path']

// Renders the export dialog of a page, inside its TableExportProvider and table providers
export const TableExportDialogHost: FC<TableExportDialogHostProps> = ({
  projectName,
  subTypeKey,
  canImport,
  getRows,
}) => {
  const tableExport = useTableExportContext()
  const { selectedCells } = useSelectionCellsContext()
  const columnSettings = useColumnSettingsContext()
  const { attribFields, scopes } = useProjectTableContext()
  const exportTable = useTableExport()

  const selection = useMemo(() => {
    const rowIds = new Set<string>()
    const columnIds = new Set<string>()
    let fullRows = false
    for (const cellId of selectedCells) {
      const { rowId, colId } = parseCellId(cellId) || {}
      if (!rowId || !colId || rowId.startsWith(GROUP_BY_ID)) continue
      rowIds.add(rowId)
      if (colId === ROW_SELECTION_COLUMN_ID) fullRows = true
      else columnIds.add(colId)
    }
    return { rowIds: Array.from(rowIds), columnIds, fullRows }
  }, [selectedCells])

  const getColumnIds = useCallback(
    (scope: TableExportScope, settings: TableExportSettings) => {
      const visible = getVisibleColumnIds({
        allColumns: columnSettings.getAllColumns(),
        columnOrder: columnSettings.columnOrder,
        columnPinning: columnSettings.columnPinning,
        columnVisibility: columnSettings.columnVisibility,
        defaultColumnVisibility: columnSettings.defaultColumnVisibility,
      })
      if (scope === 'table' || settings.selectionColumns === 'visible' || selection.fullRows) {
        return visible
      }
      return visible.filter((id) => selection.columnIds.has(id))
    },
    [columnSettings, selection],
  )

  const getSkippedColumns = (scope: TableExportScope, settings: TableExportSettings) =>
    getColumnIds(scope, settings)
      .filter((id) => !getExportColumnKey(id, subTypeKey))
      .map((id) => getExportColumnLabel(id, { attribFields, scopes }))

  const handleExport = (scope: TableExportScope, settings: TableExportSettings) => {
    const columns: string[] = []
    const columnLabels: Record<string, string> = {}
    if (canImport && settings.includeImportColumns) columns.push(...IMPORT_COLUMNS)
    for (const id of getColumnIds(scope, settings)) {
      const key = getExportColumnKey(id, subTypeKey)
      if (!key || columnLabels[key]) continue
      if (!columns.includes(key)) columns.push(key)
      columnLabels[key] = getExportColumnLabel(id, { attribFields, scopes })
    }
    return exportTable(projectName, scope, settings, {
      ...getRows(scope, selection.rowIds),
      columns,
      columnLabels,
    })
  }

  if (!tableExport) return null

  return (
    <TableExportDialog
      isOpen={!!tableExport.scope}
      onClose={tableExport.closeExportDialog}
      initialScope={tableExport.scope || 'table'}
      selectedRowsCount={selection.rowIds.length}
      canImport={canImport}
      getSkippedColumns={getSkippedColumns}
      onExport={handleExport}
    />
  )
}
