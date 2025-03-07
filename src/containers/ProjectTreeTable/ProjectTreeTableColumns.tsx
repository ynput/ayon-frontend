import { useMemo } from 'react'
import * as Styled from '@containers/Slicer/SlicerTable.styled'
import { $Any } from '@types'
import { ColumnDef, FilterFnOption, Row, SortingFn, sortingFns } from '@tanstack/react-table'
import clsx from 'clsx'
import { Icon } from '@ynput/ayon-react-components'
import styled from 'styled-components'
import { TableRow } from './utils/types'
import { TableCellContent } from './ProjectTreeTable.styled'
import { useStoredCustomColumnWidths } from './hooks/useCustomColumnsWidth'
import { AttributeData, AttributeEnumItem, AttributeModel } from '@api/rest/attributes'
import { CellWidget } from './widgets'
import { useCellEditing } from './context/CellEditingContext'
import { getCellValue } from './utils/cellUtils'

const DelayedShimmerWrapper = styled.div`
  @keyframes fadeInOpacity {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
  opacity: 0;
  width: 100%;
  animation: fadeInOpacity 1s 1 forwards;
  animation-delay: 200ms;
`

const nameSort: SortingFn<any> = (rowA, rowB) => {
  const labelA = rowA.original.label || rowA.original.name
  const labelB = rowB.original.label || rowB.original.name
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

const ShimmerCell = ({ width }: { width: string }) => {
  return (
    <Styled.Cell style={{ width }}>
      <DelayedShimmerWrapper>
        <span
          className="loading shimmer-lightest"
          style={{ display: 'inline-block', width: '100%', height: '20px' }}
        />
      </DelayedShimmerWrapper>
    </Styled.Cell>
  )
}

export type BuiltInFieldOptions = {
  folderTypes: AttributeEnumItem[]
  taskTypes: AttributeEnumItem[]
  statuses: AttributeEnumItem[]
  assignees: AttributeEnumItem[]
}

type Props = {
  tableData: TableRow[]
  attribs: AttributeModel[]
  isLoading: boolean
  isExpandable: boolean
  sliceId: string
  options: BuiltInFieldOptions
  toggleExpanderHandler: (e: React.MouseEvent, id: string) => void
}

const TableColumns = ({
  tableData,
  attribs,
  isLoading,
  sliceId,
  options,
  toggleExpanderHandler,
}: Props) => {
  // Remove the editingId state, we're now using the context
  const storedColumnSizes = useStoredCustomColumnWidths() as Record<string, number>

  const { updateEntities } = useCellEditing()

  return useMemo<ColumnDef<TableRow>[]>(() => {
    const staticColumns: ColumnDef<TableRow>[] = [
      {
        accessorKey: 'name',
        header: () => 'Folder',
        filterFn: 'fuzzy',
        sortingFn: nameSort, // custom sort to sort by label then name
        size: storedColumnSizes['label'] || 300,
        cell: ({ row }) => {
          return !row.original.id ? (
            <ShimmerCell width="300px" />
          ) : (
            <TableCellContent
              className={clsx('large', { selected: row.getIsSelected(), loading: isLoading })}
              style={{
                //  add depth padding to the cell
                paddingLeft: `calc(${row.depth * 0.5}rem + 4px)`,
              }}
              tabIndex={0}
            >
              {row.original.data.type === 'folder' ? (
                <Styled.Expander
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleExpanderHandler(e, row.id)
                    row.getToggleExpandedHandler()()
                  }}
                  icon={row.getIsExpanded() ? 'expand_more' : 'chevron_right'}
                />
              ) : (
                <div style={{ display: 'inline-block', minWidth: 24 }} />
              )}
              {row.original.icon && <Icon icon={row.original.icon} />}
              <span className="label">{row.original.label || row.original.name}</span>
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
        size: storedColumnSizes['status'] || 150,
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
        size: storedColumnSizes['type'] || 150,
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
        size: storedColumnSizes['assignees'] || 150,
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
    ]

    const attributeColumns = attribs.map((attrib) => {
      const attribColumn: ColumnDef<TableRow> = {
        accessorKey: 'attrib.' + attrib.name,
        header: () => attrib.data.title || attrib.name,
        filterFn: 'fuzzy' as FilterFnOption<TableRow>,
        sortingFn: (a, b, c) => attribSort(a, b, c, attrib.data),
        size: storedColumnSizes[attrib.name] || 150,
        cell: ({ row, column }) => {
          const columnId = column.id.replace('attrib_', '')
          const { value, id, type } = getValueIdType(row, columnId, 'attrib')

          return (
            <CellWidget
              rowId={id}
              columnId={columnId}
              value={value}
              attributeData={{ type: attrib.data.type || 'string' }}
              options={attrib.data.enum || []}
              isCollapsed={!!row.original.childOnlyMatch}
              onChange={(value) =>
                updateEntities([{ field: columnId, value, id, type, isAttrib: true }])
              }
            />
          )
        },
      }
      return attribColumn
    })

    return [...staticColumns, ...attributeColumns]
  }, [isLoading, sliceId, tableData, options, attribs, updateEntities])
}

export default TableColumns

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
