import { FC, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { dataImportApi } from '@shared/api'
import {
  TABLE_EXPORT_SEARCH_PARAM,
  useProjectContext,
  useTableExportContext,
} from '@shared/context'
import type {
  TableExportContent,
  TableExportOptions,
  TableExportRows,
  TableExportScope,
} from '@shared/context'
import { useColumnSettingsContext } from '../ProjectTreeTable/context/column-settings'
import { useSelectionCellsContext } from '../ProjectTreeTable/context/selection-cells'
import { useProjectTableContext } from '../ProjectTreeTable/context/project-table'
import { parseCellId } from '../ProjectTreeTable/utils/cellUtils'
import { ROW_SELECTION_COLUMN_ID } from '../ProjectTreeTable/constants'
import { GROUP_BY_ID } from '../ProjectTreeTable/hooks/useBuildGroupByTableData'
import type { ParentColumnDefinition } from '../ProjectTreeTable/types'
import {
  getExportColumnKey,
  getExportColumnLabel,
  getVisibleColumnIds,
  SubTypeKey,
} from './tableExportColumns'

export type TableExportSourceProps = {
  projectName: string
  subTypeKey: SubTypeKey
  canImport?: boolean // the rows can be imported back with Import CSV
  // the rows to export: the whole table, or the selected table rows
  getRows: (scope: TableExportScope, selectedRowIds: string[]) => TableExportRows
  parentColumns?: ParentColumnDefinition[] // the table's parent columns, for their labels
}

const IMPORT_COLUMNS = ['entity_type', 'path']
export const NOT_IMPORTABLE = "(Import CSV can't read it)"

// the dialog's importable file: a raw CSV with the import columns
export const isForImport = ({ includeImportColumns, format, content }: TableExportOptions) =>
  includeImportColumns && format === 'csv' && content === 'raw'

// Registers what the page's table exports (rows, columns and their labels) for the Power Pack
// export dialog. Rendered inside the page's table providers.
export const TableExportSource: FC<TableExportSourceProps> = ({
  projectName,
  subTypeKey,
  canImport = false,
  getRows,
  parentColumns,
}) => {
  const tableExport = useTableExportContext()
  const registerSource = tableExport?.registerSource
  const { selectedCells } = useSelectionCellsContext()
  const columnSettings = useColumnSettingsContext()
  const { attribFields, scopes } = useProjectTableContext()
  const { linkTypes } = useProjectContext()

  // the columns Import CSV reads, only fetched while the dialog is open
  const [searchParams] = useSearchParams()
  const { data: importFields } = dataImportApi.useExportFieldsQuery(
    { projectName, entityType: 'hierarchy' },
    { skip: !canImport || !searchParams.has(TABLE_EXPORT_SEARCH_PARAM) },
  )
  const importKeys = useMemo(
    () => importFields && new Set(importFields.map((field) => field.key)),
    [importFields],
  )

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

  const source = useMemo(() => {
    const labelContext = { attribFields, scopes, linkTypes, parentColumns }

    const getColumnIds = (scope: TableExportScope, options: TableExportOptions) => {
      const visible = getVisibleColumnIds({
        allColumns: columnSettings.getAllColumns(),
        columnOrder: columnSettings.columnOrder,
        columnPinning: columnSettings.columnPinning,
        columnVisibility: columnSettings.columnVisibility,
        defaultColumnVisibility: columnSettings.defaultColumnVisibility,
      })
      if (scope === 'table' || options.selectionColumns === 'visible' || selection.fullRows) {
        return visible
      }
      return visible.filter((id) => selection.columnIds.has(id))
    }

    // an importable file only has columns Import CSV can read, other columns stop the import
    const isImportable = (key: string, options: TableExportOptions) =>
      !canImport || !isForImport(options) || !importKeys || importKeys.has(key)

    const getSkippedColumns = (scope: TableExportScope, options: TableExportOptions) =>
      getColumnIds(scope, options).flatMap((id) => {
        const key = getExportColumnKey(id, subTypeKey)
        const label = getExportColumnLabel(id, labelContext)
        if (!key) return [label]
        return isImportable(key, options) ? [] : [`${label} ${NOT_IMPORTABLE}`]
      })

    const getContent = (
      scope: TableExportScope,
      options: TableExportOptions,
    ): TableExportContent => {
      const columns: string[] = []
      const columnLabels: Record<string, string> = {}
      if (canImport && options.includeImportColumns) columns.push(...IMPORT_COLUMNS)
      for (const id of getColumnIds(scope, options)) {
        const key = getExportColumnKey(id, subTypeKey)
        if (!key || columnLabels[key] || !isImportable(key, options)) continue
        if (!columns.includes(key)) columns.push(key)
        columnLabels[key] = getExportColumnLabel(id, labelContext)
      }
      return { ...getRows(scope, selection.rowIds), columns, columnLabels }
    }

    return {
      projectName,
      canImport,
      selectedRowsCount: selection.rowIds.length,
      getContent,
      getSkippedColumns,
    }
  }, [
    projectName,
    canImport,
    subTypeKey,
    getRows,
    parentColumns,
    selection,
    columnSettings,
    attribFields,
    scopes,
    linkTypes,
    importKeys,
  ])

  useEffect(() => registerSource?.(source), [registerSource, source])

  return null
}
