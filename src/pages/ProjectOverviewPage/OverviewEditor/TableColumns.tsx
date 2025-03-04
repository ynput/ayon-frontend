import { useMemo } from 'react'
import * as Styled from '@containers/Slicer/SlicerTable.styled'
import { $Any } from '@types'
import { ColumnDef, FilterFnOption, Row, SortingFn, sortingFns } from '@tanstack/react-table'
import { compareItems } from '@tanstack/match-sorter-utils'
import clsx from 'clsx'
import { Icon } from '@ynput/ayon-react-components'
import styled from 'styled-components'
import { TableRow } from './types'
import { TableCellContent } from './Table.styled'
import { useStoredCustomColumnWidths } from './hooks/useCustomColumnsWidth'
import { AttributeEnumItem, AttributeModel } from '@api/rest/attributes'
import { EditorCell } from './Cells/EditorCell'
import { useCellEditing } from './context/CellEditingContext'

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

// Define a custom fuzzy sort function that will sort by rank if the row has ranking information
const fuzzySort: SortingFn<any> = (rowA, rowB, columnId) => {
  let dir = 0

  // Only sort by rank if the column has ranking information
  if (rowA.columnFiltersMeta[columnId]) {
    dir = compareItems(
      // @ts-ignore
      rowA.columnFiltersMeta[columnId]?.itemRank!,
      // @ts-ignore
      rowB.columnFiltersMeta[columnId]?.itemRank!,
    )
  }

  // Provide an alphanumeric fallback for when the item ranks are equal
  return dir === 0 ? sortingFns.alphanumeric(rowA, rowB, columnId) : dir
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
        sortingFn: fuzzySort, //sort by fuzzy rank (falls back to alphanumeric)
        size: storedColumnSizes['label'] || 300,
        cell: ({ row, getValue }) => {
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
        sortingFn: fuzzySort, //sort by fuzzy rank (falls back to alphanumeric)
        size: storedColumnSizes['status'] || 150,
        cell: ({ row, column }) => {
          const { value, id, type } = getValueIdType(row, column.id)

          return (
            <EditorCell
              rowId={id}
              columnId={column.id}
              value={value}
              attributeData={{ type: 'string' }}
              options={options.statuses}
              isCollapsed={!!row.original.childOnlyMatch}
              onChange={(value) => updateEntities(column.id, value, [{ id, type }], false)}
            />
          )
        },
      },
      {
        accessorKey: 'subType',
        header: () => 'Type',
        filterFn: 'fuzzy',
        sortingFn: fuzzySort, //sort by fuzzy rank (falls back to alphanumeric)
        size: storedColumnSizes['type'] || 150,
        cell: ({ row, column }) => {
          const { value, id, type } = getValueIdType(row, column.id)
          const fieldId = type === 'folder' ? 'folderType' : 'taskType'
          return (
            <EditorCell
              rowId={id}
              columnId={column.id}
              value={value}
              attributeData={{ type: 'string' }}
              options={type === 'folder' ? options.folderTypes : options.taskTypes}
              isCollapsed={!!row.original.childOnlyMatch}
              onChange={(value) => updateEntities(fieldId, value, [{ id, type }], false)}
            />
          )
        },
      },
      {
        accessorKey: 'assignees',
        header: () => 'Assignees',
        filterFn: 'fuzzy',
        sortingFn: fuzzySort, //sort by fuzzy rank (falls back to alphanumeric)
        size: storedColumnSizes['assignees'] || 150,
        cell: ({ row, column }) => {
          const { value, id, type } = getValueIdType(row, column.id)
          if (type === 'folder') return null
          return (
            <EditorCell
              rowId={id}
              columnId={column.id}
              value={value}
              attributeData={{ type: 'list_of_strings' }}
              options={options.assignees}
              isCollapsed={!!row.original.childOnlyMatch}
              onChange={(value) => updateEntities(column.id, value, [{ id, type }], false)}
            />
          )
        },
      },
    ]

    const attributeColumns = attribs.map((attrib) => {
      const attribColumn: ColumnDef<TableRow> = {
        accessorKey: attrib.name,
        header: () => attrib.data.title || attrib.name,
        filterFn: 'fuzzy' as FilterFnOption<TableRow>,
        sortingFn: fuzzySort, //sort by fuzzy rank (falls back to alphanumeric)
        size: storedColumnSizes[attrib.name] || 150,
        cell: ({ row, column }) => {
          const { value, id, type } = getValueIdType(row, column.id, 'attrib')
          const attrib = attribs.find((a) => a.name === column.id)

          return (
            <EditorCell
              rowId={id}
              columnId={column.id}
              value={value}
              attributeData={{ type: attrib?.data.type || 'string' }}
              options={attrib?.data.enum || []}
              isCollapsed={!!row.original.childOnlyMatch}
              onChange={(value) => updateEntities(column.id, value, [{ id, type }], true)}
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
