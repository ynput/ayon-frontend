import { useMemo, useRef, useState } from 'react'
import * as Styled from '@containers/Slicer/SlicerTable.styled'
import { $Any } from '@types'
import {
  Column,
  ColumnDef,
  FilterFnOption,
  Getter,
  Row,
  SortingFn,
  sortingFns,
} from '@tanstack/react-table'
import { compareItems } from '@tanstack/match-sorter-utils'
import clsx from 'clsx'
import { Icon } from '@ynput/ayon-react-components'
import styled from 'styled-components'
import { TableRow } from './types'
import { FolderNode, TaskNode, UserNode } from '@api/graphql'
import { EditableCellContent, TableCellContent } from './Table.styled'
import { getPriorityOptions } from '@pages/TasksProgressPage/helpers'
import { useGetAttributeConfigQuery } from '@queries/attributes/getAttributes'
import { useSelector } from 'react-redux'
import StatusCell from './Cells/StatusCell'
import PriorityCell from './Cells/PriorityCell'
import FolderTypeCell from './Cells/FolderTypeCell'
import TaskTypeCell from './Cells/TaskTypeCell'
import AssigneesCell from './Cells/AssigneesCell'
import { useStoredCustomColumnWidths } from './hooks/useCustomColumnsWidth'
import { Status } from '@api/rest/project'
import { AttributeModel } from '@api/rest/attributes'

const CellWrapper = styled.div`
  width: 150px;
  height: 36px;
  box-sizing: border-box;
  padding-right: 2px;
`
const PlaceholderDot = styled.div`
  width: 150px;
  width: 8px;
  height: 8px;
  align-self: center;
  justify-self: center;
  border-radius: 4px;
  background-color: grey;
`

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

type Props = {
  tableData: $Any[]
  users: UserNode[]
  statuses: Status[]
  attribs: AttributeModel[]
  isLoading: boolean
  isExpandable: boolean
  sliceId: string
  toggleExpanderHandler: $Any
  updateHandler: $Any
}

const TableColumns = ({
  tableData,
  users,
  statuses,
  attribs,
  isLoading,
  sliceId,
  toggleExpanderHandler,
  updateHandler,
}: Props) => {
  const project = useSelector((state: $Any) => state.project)

  const { data: priorityAttrib } = useGetAttributeConfigQuery({ attributeName: 'priority' })
  const priorities = getPriorityOptions(priorityAttrib, 'task') || []
  const storedColumnSizes = useStoredCustomColumnWidths()

  const getRowType = (item: Row<TableRow>) => {
    return item.original.data.type === 'folder' ? 'folders' : 'tasks'
  }
  const getRawData = (item: Row<TableRow>) => {
    return rawData[getRowType(item)]?.[item.id]
  }

  const getRawDataParentId = (row: Row<TableRow>): string => {
    return getRowType(row) === 'folders' ? 'parentId' : 'folderId'
  }
  const getRawDataAttribValue = (rawData: FolderNode | TaskNode, attribName: string): string => {
    if (!rawData) {
      return 'missing value'
    }
    if (rawData.ownAttrib === undefined) {
      return 'missing value'
    }
    if (rawData.ownAttrib.includes(attribName)) {
      // @ts-ignore
      return rawData.attrib?.[attribName] || ''
    }

    return getRawDataAttribValue(rawData[parentId], attribName)
  }

  const getRowAttribValue = (row: Row<TableRow>, attribName: string): string => {
    const parentId = getRawDataParentId(row)
    const rawData = getRawData(row)
    if (rawData === undefined || rawData.attrib === undefined) {
      return ''
    }
    if (rawData.attrib[attribName] !== undefined) {
      return rawData.attrib[attribName]
    }

    if (rawData.ownAttrib === undefined) {
      return '...'
    }
    if (rawData.ownAttrib.includes(attribName)) {
      // @ts-ignore
      return rawData.attrib?.[attribName] || ''
    }

    return getRawDataAttribValue(rawData[parentId], attribName)
  }

  const getValueIdType = (
    row: Row<TableRow>,
    field: Column<TableRow>['id'],
    nestedField?: string,
  ): {
    value: $Any
    id: string
    type: string
  } => ({
    value: nestedField ? row.original[nestedField]?.[field] : row.original[field],
    id: row.id,
    type: row.original.data.type,
  })

  return useMemo<ColumnDef<TableRow>[]>(() => {
    console.time('createStaticColumns')
    const staticColumns: ColumnDef<TableRow>[] = [
      {
        accessorKey: 'folderType',
        header: () => 'Folder',
        filterFn: 'fuzzy',
        sortingFn: fuzzySort, //sort by fuzzy rank (falls back to alphanumeric)
        size: storedColumnSizes['folderType'] || '300',
        cell: ({ row, getValue }) => {
          return !row.original.id ? (
            <ShimmerCell width="300px" />
          ) : (
            <TableCellContent
              className={clsx('large', { selected: row.getIsSelected(), loading: isLoading })}
              // onClick={(evt) => handleRowSelect(evt, row)}
              // onKeyDown={(evt) => handleRowKeyDown(evt, row)}
              style={{
                //  add depth padding to the cell
                paddingLeft: `calc(${row.depth * 0.5}rem + 4px)`,
                width: '300px',
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
                  style={{ cursor: 'pointer' }}
                />
              ) : (
                <div style={{ display: 'inline-block', minWidth: 24 }} />
              )}
              {row.original.icon ? (
                <Icon icon={row.original.icon} />
              ) : (
                <span
                  className="loading shimmer-light"
                  style={{ minWidth: '20px', height: '20px' }}
                />
              )}
              {row.original.id ? (
                row.original.name && row.original.name
              ) : (
                <span
                  className="loading shimmer-light"
                  style={{ minWidth: '20px', height: '20px' }}
                />
              )}
              {row.original.startContent && row.original.startContent}
              <span className="title">{getValue<boolean>()}</span>
              <span className="title">{getValue<string>()}</span>
            </TableCellContent>
          )
        },
      },
      {
        accessorKey: 'status',
        header: () => 'Status',
        filterFn: 'fuzzy',
        sortingFn: fuzzySort, //sort by fuzzy rank (falls back to alphanumeric)
        size: storedColumnSizes['status'] || '150',
        cell: ({ row, column }) => {
          const { value, id, type } = getValueIdType(row, column.id)
          // <ShimmerCell width="150px" />
          // @ts-ignore
          if (row.original.childOnlyMatch) {
            return <PlaceholderDot />
          }

          return (
            <CellWrapper>
              <StatusCell
                status={value}
                statuses={statuses}
                updateHandler={(newValue: string[]) => {
                  updateHandler(id, 'status', newValue[0], type, false)
                }}
              />
            </CellWrapper>
          )
          return !row.original.id || getRawData(row) === undefined ? (
            <TableCellContent> ... </TableCellContent>
          ) : (
            <TableCellContent
              className={clsx({ selected: row.getIsSelected(), loading: isLoading })}
              // onClick={(evt) => handleRowSelect(evt, row)}
              // onKeyDown={(evt) => handleRowKeyDown(evt, row)}
              tabIndex={0}
            >
              {/* @ts-ignore */}
              {rawData?.status || 'none'}
            </TableCellContent>
          )
        },
      },
      {
        accessorKey: 'subType',
        header: () => 'Type',
        filterFn: 'fuzzy',
        sortingFn: fuzzySort, //sort by fuzzy rank (falls back to alphanumeric)
        size: storedColumnSizes['type'] || '150',
        cell: ({ row, column }) => {
          const { value, id, type } = getValueIdType(row, column.id)
          const subType = row.original.subType
          // <ShimmerCell width="150px" />
          // @ts-ignore
          if (row.original.childOnlyMatch) {
            return <PlaceholderDot />
          }
          return (
            <CellWrapper>
              {type === 'folder' ? (
                <FolderTypeCell
                  folderTypes={project.folders}
                  type={value}
                  updateHandler={(newValue: string) => {
                    // TODO Propagate change to folder type column also
                    updateHandler(id, 'folderType', newValue, subType, false)
                  }}
                />
              ) : (
                <TaskTypeCell
                  taskTypes={project.tasks}
                  type={value}
                  updateHandler={(newValue: string) => {
                    // TODO Propagate change to folder type column also
                    updateHandler(id, 'taskType', newValue, subType, false)
                  }}
                />
              )}
            </CellWrapper>
          )
          return !row.original.id || getRawData(row) === undefined ? (
            <TableCellContent> ... </TableCellContent>
          ) : (
            <TableCellContent
              className={clsx({ selected: row.getIsSelected(), loading: isLoading })}
              // onClick={(evt) => handleRowSelect(evt, row)}
              // onKeyDown={(evt) => handleRowKeyDown(evt, row)}
              tabIndex={0}
            >
              {rawData?.status || 'none'}
            </TableCellContent>
          )
        },
      },
      {
        accessorKey: 'assignees',
        header: () => 'Assignees',
        filterFn: 'fuzzy',
        sortingFn: fuzzySort, //sort by fuzzy rank (falls back to alphanumeric)
        size: storedColumnSizes['assignees'] || '150',
        cell: ({ row, column }) => {
          const { value, id, type } = getValueIdType(row, column.id)
          // <ShimmerCell width="150px" />
          // @ts-ignore
          if (row.original.childOnlyMatch) {
            return <PlaceholderDot />
          }
          return (
            <div style={{ width: '150px', height: '36px' }}>
              {type === 'tasks' && (
                <AssigneesCell
                  assignees={value}
                  allUsers={users}
                  updateHandler={(newValue) => {
                    updateHandler(id, 'assignees', newValue, 'task', false)
                  }}
                />
              )}
            </div>
          )
          return !row.original.id || rawData === undefined ? (
            <TableCellContent> ... </TableCellContent>
          ) : (
            <TableCellContent
              className={clsx({ selected: row.getIsSelected(), loading: isLoading })}
              // onClick={(evt) => handleRowSelect(evt, row)}
              // onKeyDown={(evt) => handleRowKeyDown(evt, row)}
              style={{
                width: '150px',
              }}
              tabIndex={0}
            >
              {rawType === 'folders' ? '' : (rawData as TaskNode).attrib?.assignees || 'None'}
            </TableCellContent>
          )
        },
      },
    ]
    console.timeEnd('createStaticColumns')

    console.time('createAttributeColumns')
    const attributeColumns = attribs.map((attrib) => {
      const attribColumn: ColumnDef<TableRow> = {
        accessorKey: attrib.name,
        header: () => attrib.data.title || attrib.name,
        filterFn: 'fuzzy' as FilterFnOption<TableRow>,
        sortingFn: fuzzySort, //sort by fuzzy rank (falls back to alphanumeric)
        size: storedColumnSizes[attrib.name] || '150',
        cell: ({ row, column, getValue }) => {
          const { value, id, type } = getValueIdType(row, column.id, 'attrib')

          // <ShimmerCell width="150px" />
          // @ts-ignore
          if (row.original.childOnlyMatch) {
            return <PlaceholderDot />
          }
          return (
            <CellWrapper>
              {!value ? (
                <EditableCellContent value="..." />
              ) : (
                <EditableCellContent
                  className={clsx({ selected: row.getIsSelected(), loading: isLoading })}
                  // onClick={(evt) => handleRowSelect(evt, row)}
                  // onKeyDown={(evt) => handleRowKeyDown(evt, row)}
                  updateHandler={(newValue: string) => {
                    updateHandler(id, attrib.name, newValue, type)
                  }}
                  tabIndex={0}
                  value={value}
                />
              )}
            </CellWrapper>
          )
        },
      }
      return attribColumn
    })
    console.timeEnd('createAttributeColumns')

    return [...staticColumns, ...attributeColumns]
  }, [isLoading, sliceId, tableData])
}
export default TableColumns
