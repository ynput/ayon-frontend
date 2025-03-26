import { useMemo } from 'react'
import { $Any } from '@types'
import {
  ColumnDef,
  ColumnSizingState,
  FilterFnOption,
  Row,
  SortingFn,
  sortingFns,
} from '@tanstack/react-table'
import { TableRow } from './utils/types'
import { AttributeData, AttributeEnumItem, AttributeModel } from '@api/rest/attributes'
import { CellWidget, EntityNameWidget } from './widgets'
import { useCellEditing } from './context/CellEditingContext'
import { getCellId, getCellValue } from './utils/cellUtils'
import { TableCellContent } from './ProjectTreeTable.styled'
import clsx from 'clsx'
import { SelectionCell } from './components/SelectionCell'
import RowSelectionHeader from './components/RowSelectionHeader'
import { ROW_SELECTION_COLUMN_ID } from './context/SelectionContext'

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

export type BuiltInFieldOptions = {
  folderTypes: AttributeEnumItem[]
  taskTypes: AttributeEnumItem[]
  statuses: AttributeEnumItem[]
  assignees: AttributeEnumItem[]
  tags: AttributeEnumItem[]
}

type Props = {
  tableData: TableRow[]
  attribs: AttributeModel[]
  columnSizing: ColumnSizingState
  isLoading: boolean
  isExpandable: boolean
  showHierarchy: boolean
  sliceId: string
  options: BuiltInFieldOptions
  toggleExpandAll: (id: string) => void
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
        filterFn: 'fuzzy',
        sortingFn: showHierarchy ? nameSort : pathSort, // custom sort to sort by label then name
        size: columnSizing['label'] || 300,
        enableHiding: false,
        cell: ({ row, column }) => {
          const cellId = getCellId(row.id, column.id)
          return (
            <TableCellContent
              className={clsx('large', row.original.data.type, { loading: isLoading })}
              style={{
                paddingLeft: `calc(${row.depth * 1}rem + 8px)`,
              }}
              tabIndex={0}
              id={cellId}
            >
              <EntityNameWidget
                id={row.id}
                label={row.original.label}
                name={row.original.name}
                path={!showHierarchy ? row.original.path : undefined}
                showHierarchy={showHierarchy}
                icon={row.original.icon}
                type={row.original.data.type}
                isExpanded={row.getIsExpanded()}
                toggleExpandAll={toggleExpandAll}
                toggleExpanded={row.getToggleExpandedHandler()}
              />
            </TableCellContent>
          )
        },
      },
      {
        accessorKey: 'status',
        header: () => 'Status',
        filterFn: 'fuzzy',
        sortingFn: (a, b, c) => attribSort(a, b, c, { enum: options.statuses, type: 'string' }),
        sortDescFirst: true,
        size: columnSizing['status'] || 150,
        cell: ({ row, column }) => {
          const { value, id, type } = getValueIdType(row, column.id)

          return (
            <CellWidget
              rowId={id}
              columnId={column.id}
              value={value}
              attributeData={{ type: 'string' }}
              options={options.statuses}
              isCollapsed={!!row.original.childOnlyMatch}
              onChange={(value) => updateEntities([{ field: column.id, value, id, type }])}
            />
          )
        },
      },
      {
        accessorKey: 'subType',
        header: () => 'Type',
        filterFn: 'fuzzy',
        size: columnSizing['type'] || 150,
        cell: ({ row, column }) => {
          const { value, id, type } = getValueIdType(row, column.id)
          const fieldId = type === 'folder' ? 'folderType' : 'taskType'
          return (
            <CellWidget
              rowId={id}
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
        filterFn: 'fuzzy',
        size: columnSizing['assignees'] || 150,
        cell: ({ row, column }) => {
          const { value, id, type } = getValueIdType(row, column.id)
          if (type === 'folder')
            return <CellWidget rowId={id} columnId={column.id} value="" isPlaceholder />
          return (
            <CellWidget
              rowId={id}
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
        filterFn: 'fuzzy',
        size: columnSizing['tags'] || 150,
        cell: ({ row, column }) => {
          const { value, id, type } = getValueIdType(row, column.id)
          return (
            <CellWidget
              rowId={id}
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
        sortingFn: (a, b, c) => attribSort(a, b, c, attrib.data),
        size: columnSizing[attrib.name] || 150,
        cell: ({ row, column }) => {
          const columnIdParsed = column.id.replace('attrib_', '')
          const { value, id, type } = getValueIdType(row, columnIdParsed, 'attrib')
          const isInherited = !row.original.ownAttrib.includes(columnIdParsed)

          return (
            <CellWidget
              rowId={id}
              columnId={column.id}
              value={value}
              attributeData={{ type: attrib.data.type || 'string' }}
              options={attrib.data.enum || []}
              isCollapsed={!!row.original.childOnlyMatch}
              isInherited={isInherited}
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
  value: $Any
  id: string
  type: string
} => ({
  value: nestedField
    ? (row.original[nestedField as keyof TableRow] as any)?.[field]
    : (row.original[field as keyof TableRow] as any),
  id: row.id,
  type: row.original.data.type,
})
