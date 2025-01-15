import { useMemo, useState } from 'react'
import * as Styled from '@containers/Slicer/SlicerTable.styled'
import { $Any } from '@types'
import { ColumnDef, FilterFnOption, Row, SortingFn, sortingFns } from '@tanstack/react-table'
import { compareItems } from '@tanstack/match-sorter-utils'
import clsx from 'clsx'
import { AssigneeSelect, Icon } from '@ynput/ayon-react-components'
import styled from 'styled-components'
import { TableRow } from './types'
import { FolderNode, TaskNode } from '@api/graphql'
import { EditableCellContent, TableCellContent } from './Table.styled'
import { getPriorityOptions } from '@pages/TasksProgressPage/helpers'
import { useGetAttributeConfigQuery } from '@queries/attributes/getAttributes'
import { useGetUsersAssigneeQuery } from '@queries/user/getUsers'
import { useSelector } from 'react-redux'
import StatusCell from './Cells/StatusCell'
import PriorityCell from './Cells/PriorityCell'
import FolderTypeCell from './Cells/FolderTypeCell'
import TaskTypeCell from './Cells/TaskTypeCell'

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

type Props = {
  tableData: $Any[]
  rawData: { folders: $Any; tasks: $Any }
  attribs: $Any[]
  isLoading: boolean
  isExpandable: boolean
  sliceId: string
  toggleExpanderHandler: $Any
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
const TableColumns = ({
  tableData,
  rawData,
  attribs,
  isLoading,
  sliceId,
  toggleExpanderHandler,
}: Props) => {
  const project = useSelector((state: $Any) => state.project)

  const { data: priorityAttrib } = useGetAttributeConfigQuery({ attributeName: 'priority' })
  const priorities = getPriorityOptions(priorityAttrib, 'task') || []
  const projectName = useSelector((state: $Any) => state.project.name)
  const { data: allUsers = [] } = useGetUsersAssigneeQuery({ names: undefined, projectName })

  const getRowType = (item: Row<TableRow>) => {
    return item.original.data.type === 'folder' ? 'folders' : 'tasks'
  }
  const getRawData = (item: Row<TableRow>) => {
    return rawData[getRowType(item)][item.id]
  }

  const getRawDataParentId = (row: Row<TableRow>): string => {
    return getRowType(row) === 'folders' ? 'parentId' : 'folderId'
  }
  const getRawDataAttribValue = (rawData: FolderNode | TaskNode, attribName: string): string => {
    if (rawData.ownAttrib === undefined) {
      return 'bad'
    }
    if (rawData.ownAttrib.includes(attribName)) {
      // @ts-ignore
      return rawData.attrib?.[attribName] || ''
    }

    return 'foo'
    // return getRawDataAttribValue(rawData[parentId], attribName)
  }

  const getRowAttribValue = (row: Row<TableRow>, attribName: string): string => {
    const parentId = getRawDataParentId(row)
    const rawData = getRawData(row)
    if (rawData.attrib[attribName] !== undefined) {
      return rawData.attrib[attribName]
    }

    if (rawData.ownAttrib === undefined) {
      return 'bad'
    }
    if (rawData.ownAttrib.includes(attribName)) {
      // @ts-ignore
      return rawData.attrib?.[attribName] || ''
    }

    return getRawDataAttribValue(rawData[parentId], attribName)
  }

  return useMemo<ColumnDef<TableRow>[]>(
    () => [
      {
        accessorKey: 'folderType',
        header: () => 'Folder',
        filterFn: 'fuzzy',
        sortingFn: fuzzySort, //sort by fuzzy rank (falls back to alphanumeric)
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
                <Icon icon={row.original.icon} style={{ color: row.original.iconColor }} />
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
        cell: ({ row, getValue }) => {
          const rawData = getRawData(row)
          // <ShimmerCell width="150px" />
          return (
            <div style={{ width: '150px' }}>
                <StatusCell status={rawData?.status || 'Not Ready'} />
            </div>
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
        accessorKey: 'type',
        header: () => 'Type',
        filterFn: 'fuzzy',
        sortingFn: fuzzySort, //sort by fuzzy rank (falls back to alphanumeric)
        cell: ({ row, getValue }) => {
          const rawData = getRawData(row)
          // <ShimmerCell width="150px" />
          return (
            <div style={{ width: '150px' }}>
              {rawData?.folderType ? (
                <FolderTypeCell
                  folderTypes={project.folders}
                  type={rawData?.folderType || 'Folder'}
                />
              ) : (
                <TaskTypeCell taskTypes={project.tasks} type={rawData?.taskType || 'task'} />
              )}
            </div>
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
        cell: ({ row, getValue }) => {
          const rawType = getRowType(row)
          const rawData = getRawData(row)
          // <ShimmerCell width="150px" />
          return (
            <div style={{ width: '150px' }}>
              <AssigneeSelect value={rawData?.assignees || []} options={allUsers} />
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
              {/* @ts-ignore */}
              {rawType === 'folders' ? '' : (rawData as TaskNode).attrib?.assignees || 'None'}
            </TableCellContent>
          )
        },
      },
      {
        accessorKey: 'priority',
        header: () => 'Priority',
        filterFn: 'fuzzy',
        sortingFn: fuzzySort, //sort by fuzzy rank (falls back to alphanumeric)
        cell: ({ row, getValue }) => {
          const rawType = getRowType(row)
          const rawData = getRawData(row)
          // <ShimmerCell width="150px" />
          return (
            <div style={{ width: '150px' }}>
              <PriorityCell
                priority={rawData?.attrib?.priority || 'normal'}
                priorities={priorities}
              />
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
              {/* @ts-ignore */}
              {rawType === 'folders' ? '' : (rawData as TaskNode).attrib?.assignees || 'None'}
            </TableCellContent>
          )
        },
      },
      ...attribs
        .filter((el) => {
          // TODO better ordering/filtering for attributes list
          return el.name !== 'priority'
          return true
        })
        .map((attrib: $Any) => {
          return {
            accessorKey: attrib.name,
            header: () => attrib.name,
            filterFn: 'fuzzy' as FilterFnOption<TableRow>,
            sortingFn: fuzzySort, //sort by fuzzy rank (falls back to alphanumeric)
            cell: ({ row, getValue }: { row: $Any; getValue: $Any }) => {
              const rawData = getRawData(row)
              const value = getRowAttribValue(row, attrib.name)
              const [val, setVal] = useState(value)
              // <ShimmerCell width="150px" />
              return !row.original.id || rawData === undefined ? (
                <EditableCellContent value="..." />
              ) : (
                <EditableCellContent
                  className={clsx({ selected: row.getIsSelected(), loading: isLoading })}
                  // onClick={(evt) => handleRowSelect(evt, row)}
                  // onKeyDown={(evt) => handleRowKeyDown(evt, row)}
                  updateHandler={(newValue: string) => {
                    setVal(newValue)
                  }}
                  tabIndex={0}
                  value={val}
                />
              )
            },
          }
        }),
    ],
    [isLoading, sliceId, tableData],
  )
}
export { TableColumns }
