import { useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getExpandedRowModel,
  filterFns,
  flexRender,
  Row,
} from '@tanstack/react-table'

import clsx from 'clsx'

import { $Any } from '@types'
import { TableRow } from '@containers/Slicer/types'
import useHandlers, { Selection } from './handlers'
import { getAbsoluteSelections, isSelected } from './mappers'
import TableColumns from './TableColumns'
import * as Styled from './Table.styled'
import { useUpdateEntityMutation } from '@queries/entity/updateEntity'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import { FolderNode, UserNode } from '@api/graphql'
import { useCustomColumnWidths, useSyncCustomColumnWidths } from './hooks/useCustomColumnsWidth'

import {api } from '@api/rest/folders'

type Props = {
  tableData: $Any[]
  rawData: { folders: $Any; tasks: $Any }
  users: UserNode[]
  attribs: $Any[]
  isLoading: boolean
  isExpandable: boolean
  sliceId: string
  toggleExpanderHandler: $Any
  expanded: $Any
  setExpanded: $Any
}

const MyTable = ({
  tableData,
  rawData,
  attribs,
  users,
  isLoading,
  isExpandable,
  sliceId,
  toggleExpanderHandler,
  expanded,
  setExpanded,
}: Props) => {
  //The virtualizer needs to know the scrollable container element
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const [selectionInProgress, setSelectionInProgress] = useState<boolean>(false)
  const [selection, setSelection] = useState<Selection>({})
  const [selections, setSelections] = useState<Selection[]>([])
  const [updateEntity] = useUpdateEntityMutation()
  const { name: projectName } = useSelector((state: $Any) => state.project)
  const [copyValue, setCopyValue] = useState<{[key: string]: $Any} | null>(null)
  const dispatch = useDispatch()

  const foldersCacheUpdate = (id: string, type: string, value: $Any, isAttrib: boolean) => {

    dispatch(
      // @ts-ignore
      api.util.updateQueryData(
        'getFolderList',
        { projectName: projectName, attrib: true },
        (draft: $Any) => {
          const folder = draft.folders.find((folder: FolderNode) => folder.id === id)
          if (isAttrib) {
            folder.attrib[type] = value
          } else {
            folder[type] = value
          }
        },
      ),
    )
  }

  const updateEntityField = async (
    id: string,
    field: string,
    value: string,
    entityType: string,
    isAttrib: boolean,
  ) => {
    if (value === null || value === undefined) {
      return console.error('value is null or undefined')
    }

    try {
      if (isAttrib) {
        return await updateEntity({
          projectName,
          entityId: id,
          entityType,
          data: { attrib: { [field]: value } },
        })
      } else {
        return await updateEntity({
          projectName,
          entityId: id,
          entityType,
          data: { [field]: value },
        })
      }
    } catch (error) {
      toast.error('Error updating' + 'version ')
    }
  }

  const { handleMouseUp, handleMouseDown } = useHandlers({
    selection,
    setSelection,
    selections,
    setSelections,
    setSelectionInProgress,
  })

  const getRowType = (item: Row<TableRow>) => {
    // @ts-ignore
    return item.original.data.type === 'folder' ? 'folders' : 'tasks'
  }

  const getRawData = (item: Row<TableRow>) => {
    return rawData[getRowType(item)]?.[item.id]
  }

  const getCopyCellData = (item: Row<TableRow>, accessor: string) => {
    const type = getRowType(item)
    const data = getRawData(item)
    if (accessor === 'type') {
      return {
        type: type === 'folders' ? 'folderType' : 'taskType',
        value: type === 'folders' ? data.folderType : data.taskType,
        isAttrib: false,
      }
    }
    if (accessor === 'priority') {
      return {
        type: 'priority',
        value: data.attrib.priority,
        isAttrib: true,
      }
    }
    if (accessor === 'status') {
      return {
        type: 'status',
        value: data.status,
        isAttrib: false,
      }
    }
    if (accessor === 'assignees') {
      return {
        type: 'assignees',
        value: data.assignee,
        isAttrib: false,
      }
    }

    return {
      type: accessor,
      value: data.attrib[accessor],
      isAttrib: true,
    }
  }

  const columns = TableColumns({
    tableData,
    rawData,
    users,
    attribs,
    isLoading,
    isExpandable,
    sliceId,
    toggleExpanderHandler,
    updateHandler: (
      id: string,
      field: string,
      val: string,
      entityType: string,
      isAttrib: boolean = true,
    ) => {
      updateEntityField(id, field, val, entityType, isAttrib)
    },
  })

  const table = useReactTable({
    data: tableData,
    columns,
    enableRowSelection: true, //enable row selection for all rows
    getRowId: (row) => row.id,
    enableSubRowSelection: false, //disable sub row selection
    getSubRows: (row) => row.subRows,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    filterFromLeafRows: true,
    onExpandedChange: setExpanded,
    columnResizeMode: 'onChange',
    // @ts-ignore
    filterFns,
    state: {
      expanded,
    },
  })

  const { rows } = table.getRowModel()

  const absoluteSelections = getAbsoluteSelections(selections)

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => 40, //estimate row height for accurate scrollbar dragging
    getScrollElement: () => tableContainerRef.current,
    //measure dynamic row height, except in firefox because it measures table border height incorrectly
    measureElement:
      typeof window !== 'undefined' && navigator.userAgent.indexOf('Firefox') === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
    overscan: 5,
  })

  const columnSizeVars = useCustomColumnWidths(table)
  useSyncCustomColumnWidths(table.getState().columnSizing)

  const handleCopy = (cell: $Any) => {
    const cellData = getCopyCellData(cell.row, cell.column.id)
    setCopyValue(cellData)
  }

  const handlePaste = async (cell: $Any) => {
    const type = getRowType(cell.row)
    const data = getRawData(cell.row)
    if (copyValue === undefined) {
      return
    }

    await updateEntityField(
      data.id,
      copyValue!.type,
      copyValue!.value,
      type === 'folders' ? 'folder' : 'task',
      copyValue!.isAttrib,
    )

    foldersCacheUpdate(data.id, copyValue!.type, copyValue!.value, copyValue!.isAttrib)
  }

  const tableBody = (
    <tbody style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
      {rowVirtualizer.getVirtualItems().map((virtualRow: $Any, rowIdx) => {
        const row = rows[virtualRow.index] as Row<TableRow>
        return (
          <tr
            data-index={virtualRow.index} //needed for dynamic row height measurement
            // @ts-ignore
            ref={(node) => rowVirtualizer.measureElement(node)} //measure dynamic row height
            key={row.id}
            style={{
              display: 'table-row',
              transform: `translateY(${virtualRow.start}px)`, //this should always be a `style` as it changes on scroll
            }}
          >
            {row.getVisibleCells().map((cell, colIdx) => {
              return (
                <Styled.TableCell
                  tabIndex={0}
                  key={cell.id}
                  className={clsx(
                    `pos-${rowIdx}-${colIdx}`,
                    cell.column.id === 'folderType' ? 'large' : '',
                    {
                      notSelected: !isSelected(absoluteSelections, rowIdx, colIdx),
                      selected: isSelected(absoluteSelections, rowIdx, colIdx),
                    },
                  )}
                  style={{
                    minWidth: '150px',
                    width: `calc(var(--col-${cell.column.id}-size) * 1px)`,
                  }}
                  onKeyUp={(e) => {
                    if (e.key === 'c' && e.ctrlKey) {
                      handleCopy(cell)
                    }
                    if (e.key === 'v' && e.ctrlKey) {
                      handlePaste(cell)
                    }
                  }}
                  onMouseDown={(e) => {
                    // @ts-ignore
                    handleMouseDown(e, cell, rowIdx, colIdx)
                  }}
                  onMouseUp={(e) => {
                    // @ts-ignore
                    handleMouseUp(e, cell, rowIdx, colIdx)
                  }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </Styled.TableCell>
              )
            })}
          </tr>
        )
      })}
    </tbody>
  )

  return (
    <Styled.TableContainerWrapper style={{ height: '100%' }}>
      <Styled.TableContainer ref={tableContainerRef} style={{ height: '100%' }}>
        <table
          style={{
            borderCollapse: 'collapse',
            userSelect: 'none',
            ...columnSizeVars,
            width: table.getTotalSize(),
          }}
        >
          <Styled.TableHeader>
            {table.getHeaderGroups().map((headerGroup) => {
              return (
                <div key={headerGroup.id} style={{ display: 'flex' }}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <Styled.HeaderCell
                        className={clsx({ large: header.column.id === 'folderType' })}
                        key={header.id}
                        colSpan={header.colSpan}
                        style={{
                          position: 'relative',
                          minWidth: '150px',
                          width: `calc(var(--header-${header?.id}-size) * 1px)`,
                        }}
                      >
                        {header.isPlaceholder ? null : (
                          <Styled.TableCellContent
                            className={clsx('bold', { large: header.column.id === 'folderType' })}
                            style={{ paddingRight: 0 }}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            <Styled.ResizedHandler
                              {...{
                                onDoubleClick: () => header.column.resetSize(),
                                onMouseDown: header.getResizeHandler(),
                                onTouchStart: header.getResizeHandler(),
                                className: `resize-handler ${
                                  header.column.getIsResizing() ? 'isResizing' : ''
                                }`,
                              }}
                            />
                          </Styled.TableCellContent>
                        )}
                      </Styled.HeaderCell>
                    )
                  })}
                </div>
              )
            })}
          </Styled.TableHeader>
          {tableBody}
        </table>
      </Styled.TableContainer>
    </Styled.TableContainerWrapper>
  )
}

export default MyTable
