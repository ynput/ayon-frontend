import { useMemo } from 'react'
import {
  ColumnDef,
  ColumnSizingState,
  FilterFnOption,
  Row,
  SortingFn,
  sortingFns,
} from '@tanstack/react-table'
import { TableRow } from './types/table'
import { AttributeData, AttributeEnumItem, AttributeWithPermissions } from './types'
import { CellWidget, EntityNameWidget } from './widgets'
import { useCellEditing } from './context/CellEditingContext'
import { getCellId, getCellValue } from './utils/cellUtils'
import { TableCellContent } from './ProjectTreeTable.styled'
import clsx from 'clsx'
import { SelectionCell } from './components/SelectionCell'
import RowSelectionHeader from './components/RowSelectionHeader'
import { ROW_SELECTION_COLUMN_ID } from './context/SelectionContext'

// Wrapper function for sorting that pushes isLoading rows to the bottom
const withLoadingStateSort = (sortFn: SortingFn<any>): SortingFn<any> => {
  return (rowA, rowB, ...args) => {
    // If row loading states differ, prioritize non-loading rows
    if (rowA.original.isLoading !== rowB.original.isLoading) {
      return rowA.original.isLoading ? 1 : -1
    }
    // Otherwise, use the original sort function
    return sortFn(rowA, rowB, ...args)
  }
}

const nameSort: SortingFn<any> = (rowA, rowB) => {
  const labelA = rowA.original.label || rowA.original.name
  const labelB = rowB.original.label || rowB.original.name
  // sort alphabetically by label
  return labelA.localeCompare(labelB)
}
const pathSort: SortingFn<any> = (rowA, rowB) => {
  const labelA = rowA.original.path || rowA.original.name
  const labelB = rowB.original.path || rowB.original.name
  // sort alphabetically by label
  return labelA.localeCompare(labelB)
}

type AttribSortingFn = (rowA: any, rowB: any, columnId: string, attribute?: AttributeData) => number
// sort by the order of the enum options
const attribSort: AttribSortingFn = (rowA, rowB, columnId, attrib) => {
  const valueA = getCellValue(rowA.original, columnId)
  const valueB = getCellValue(rowB.original, columnId)
  // if attrib is defined and has enum options, use them
  if (attrib && attrib.enum) {
    const indexA = attrib.enum.findIndex((o) => o.value === valueA)
    const indexB = attrib.enum.findIndex((o) => o.value === valueB)
    return indexA - indexB < 0 ? 1 : -1
  } else if (attrib?.type === 'datetime') {
    return sortingFns.datetime(rowA, rowB, columnId)
  } else if (attrib?.type === 'boolean') {
    const boolA = valueA === true ? 1 : 0
    const boolB = valueB === true ? 1 : 0
    return boolA - boolB
  } else {
    // default sorting
    return sortingFns.alphanumeric(rowA, rowB, columnId)
  }
}

interface EnumOption extends AttributeEnumItem {
  scope?: string[]
}

export type BuiltInFieldOptions = {
  folderTypes: EnumOption[]
  taskTypes: EnumOption[]
  statuses: EnumOption[]
  assignees: EnumOption[]
  tags: EnumOption[]
}

type Props = {
  tableData: TableRow[]
  attribs: AttributeWithPermissions[]
  columnSizing: ColumnSizingState
  isLoading: boolean
  showHierarchy: boolean
  sliceId: string
  options: BuiltInFieldOptions
  toggleExpandAll: (id: string) => void
  toggleExpanded: (id: string) => void
}

const ProjectTreeTableColumns = ({
  tableData,
  attribs,
  columnSizing = {},
  showHierarchy,
  isLoading,
  sliceId,
  options,
  toggleExpandAll,
  toggleExpanded,
}: Props) => {
  const { updateEntities } = useCellEditing()

  return useMemo<ColumnDef<TableRow, any>[]>(() => {
    const staticColumns: ColumnDef<TableRow>[] = [
      {
        id: ROW_SELECTION_COLUMN_ID,
        header: () => <RowSelectionHeader />,
        cell: () => <SelectionCell />,
        size: 20,
      },
      {
        accessorKey: 'name',
        header: () => 'Folder / Task',
        sortingFn: withLoadingStateSort(showHierarchy ? nameSort : pathSort),
        cell: ({ row, column }) => {
          const cellId = getCellId(row.id, column.id)
          return (
            <TableCellContent
              id={cellId}
              className={clsx('large', row.original.entityType, {
                loading: row.original.isLoading,
                hierarchy: showHierarchy,
              })}
              style={{
                paddingLeft: `calc(${row.depth * 1}rem + 8px)`,
              }}
              tabIndex={0}
            >
              <EntityNameWidget
                id={row.id}
                label={row.original.label}
                name={row.original.name}
                path={!showHierarchy ? row.original.path : undefined}
                showHierarchy={showHierarchy}
                icon={row.original.icon}
                type={row.original.entityType}
                isExpanded={row.getIsExpanded()}
                toggleExpandAll={toggleExpandAll}
                toggleExpanded={() => toggleExpanded(row.id)}
              />
            </TableCellContent>
          )
        },
      },
      {
        accessorKey: 'status',
        header: () => 'Status',
        sortingFn: withLoadingStateSort((a, b, c) =>
          attribSort(a, b, c, { enum: options.statuses, type: 'string' }),
        ),
        sortDescFirst: true,
        size: columnSizing['status'] || 150,
        cell: ({ row, column }) => {
          const { value, id, type } = getValueIdType(row, column.id)

          return (
            <CellWidget
              rowId={id}
              className={clsx('status', { loading: row.original.isLoading })}
              columnId={column.id}
              value={value}
              attributeData={{ type: 'string' }}
              options={options.statuses.filter((s) => s.scope?.includes(type))}
              isCollapsed={!!row.original.childOnlyMatch}
              onChange={(value) => updateEntities([{ field: column.id, value, id, type }])}
            />
          )
        },
      },
      {
        accessorKey: 'subType',
        header: () => 'Type',
        size: columnSizing['type'] || 150,
        cell: ({ row, column }) => {
          const { value, id, type } = getValueIdType(row, column.id)
          const fieldId = type === 'folder' ? 'folderType' : 'taskType'
          return (
            <CellWidget
              rowId={id}
              className={clsx('subType', { loading: row.original.isLoading })}
              columnId={column.id}
              value={value}
              attributeData={{ type: 'string' }}
              options={type === 'folder' ? options.folderTypes : options.taskTypes}
              isCollapsed={!!row.original.childOnlyMatch}
              onChange={(value) => updateEntities([{ field: fieldId, value, id, type }])}
            />
          )
        },
      },
      {
        accessorKey: 'assignees',
        header: () => 'Assignees',
        size: columnSizing['assignees'] || 150,
        cell: ({ row, column }) => {
          const { value, id, type } = getValueIdType(row, column.id)
          if (type === 'folder')
            return (
              <CellWidget
                rowId={id}
                className={clsx('assignees', { loading: row.original.isLoading })}
                columnId={column.id}
                value=""
                isPlaceholder
              />
            )
          return (
            <CellWidget
              rowId={id}
              className={clsx('assignees', { loading: row.original.isLoading })}
              columnId={column.id}
              value={value}
              attributeData={{ type: 'list_of_strings' }}
              options={options.assignees}
              isCollapsed={!!row.original.childOnlyMatch}
              onChange={(value) => updateEntities([{ field: column.id, value, id, type }])}
            />
          )
        },
      },
      {
        accessorKey: 'tags',
        header: () => 'Tags',
        size: columnSizing['tags'] || 150,
        cell: ({ row, column }) => {
          const { value, id, type } = getValueIdType(row, column.id)
          return (
            <CellWidget
              rowId={id}
              className={clsx('tags', { loading: row.original.isLoading })}
              columnId={column.id}
              value={value}
              attributeData={{ type: 'list_of_strings' }}
              options={options.tags}
              isCollapsed={!!row.original.childOnlyMatch}
              onChange={(value) => updateEntities([{ field: column.id, value, id, type }])}
              enableCustomValues
            />
          )
        },
      },
    ]

    const attributeColumns = attribs.map((attrib) => {
      const attribColumn: ColumnDef<TableRow> = {
        accessorKey: 'attrib.' + attrib.name,
        header: () => attrib.data.title || attrib.name,
        filterFn: 'fuzzy' as FilterFnOption<TableRow>,
        sortingFn: withLoadingStateSort((a, b, c) => attribSort(a, b, c, attrib.data)),
        cell: ({ row, column }) => {
          const columnIdParsed = column.id.replace('attrib_', '')
          const { value, id, type } = getValueIdType(row, columnIdParsed, 'attrib')
          const isInherited = !row.original.ownAttrib.includes(columnIdParsed)

          return (
            <CellWidget
              rowId={id}
              className={clsx('attrib', { loading: row.original.isLoading })}
              columnId={column.id}
              value={value}
              attributeData={{ type: attrib.data.type || 'string' }}
              options={attrib.data.enum || []}
              isCollapsed={!!row.original.childOnlyMatch}
              isInherited={isInherited}
              isReadOnly={attrib.readOnly}
              onChange={(value) =>
                updateEntities([{ field: columnIdParsed, value, id, type, isAttrib: true }])
              }
            />
          )
        },
      }
      return attribColumn
    })

    return [...staticColumns, ...attributeColumns]
  }, [isLoading, sliceId, tableData, options, attribs, showHierarchy, updateEntities])
}

export default ProjectTreeTableColumns

const getValueIdType = (
  row: Row<TableRow>,
  field: string,
  nestedField?: keyof TableRow,
): {
  value: any
  id: string
  type: string
} => ({
  value: nestedField
    ? (row.original[nestedField as keyof TableRow] as any)?.[field]
    : (row.original[field as keyof TableRow] as any),
  id: row.id,
  type: row.original.entityType,
})
