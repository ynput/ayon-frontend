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
  OnChangeFn,
  ExpandedState,
} from '@tanstack/react-table'

import clsx from 'clsx'

import { $Any } from '@types'
import { TableRow } from '@containers/Slicer/types'
import useHandlers, { handleToggleFolder, Selection } from './handlers'
import { getAbsoluteSelections, isSelected } from './mappers/mappers'
import TableColumns from './TableColumns'
import * as Styled from './Table.styled'
import { UserNode } from '@api/graphql'
import { useCustomColumnWidths, useSyncCustomColumnWidths } from './hooks/useCustomColumnsWidth'
import { toast } from 'react-toastify'
import { Status } from '@api/rest/project'

type Props = {
  tableData: $Any[]
  rawData: { folders: $Any; tasks: $Any }
  users: UserNode[]
  statuses: Status[]
  attribs: $Any[]
  isLoading: boolean
  isExpandable: boolean
  sliceId: string
  updateEntities: (type: string, value: $Any, entities: $Any, isAttrib: boolean) => void
  expanded: Record<string, boolean>
  updateExpanded: OnChangeFn<ExpandedState>
}

const FlexTable = ({
  tableData,
  rawData,
  attribs,
  users,
  statuses,
  isLoading,
  isExpandable,
  sliceId,
  updateEntities,
  expanded,
  updateExpanded,
}: Props) => {
  //The virtualizer needs to know the scrollable container element
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const [selectionInProgress, setSelectionInProgress] = useState<boolean>(false)
  const [selection, setSelection] = useState<Selection>({})
  const [selections, setSelections] = useState<Selection[]>([])
  const [copyValue, setCopyValue] = useState<{ [key: string]: $Any } | null>(null)

  const { handleMouseUp, handleMouseDown } = useHandlers({
    selection,
    setSelection,
    selections,
    setSelections,
    setSelectionInProgress,
  })

  const [itemExpanded, setItemExpanded] = useState<string>('root')
  const toggleExpanderHandler = handleToggleFolder(setItemExpanded)

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
        value: data.assignees,
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
    statuses,
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
      try {
        updateEntities(field, val, [{ id, type: entityType }], isAttrib)
      } catch (e) {
        toast.error('Error updating entity')
      }
    },
  })

  const table = useReactTable({
    data: tableData,
    columns,
    enableRowSelection: true, //enable row selection for all rows
    getRowId: (row) => row.id,
    enableSubRowSelection: false, //disable sub row selection
    getSubRows: (row) => row.subRows,
    getRowCanExpand: (row) => true,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    filterFromLeafRows: true,
    onExpandedChange: updateExpanded,
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

  const handleCopy = (cell: $Any, colIdx: number) => {
    const cellData = getCopyCellData(cell.row, cell.column.id)
    setCopyValue({ data: cellData, colIdx })
  }

  const handlePaste = async (cell: $Any, rows: $Any) => {
    const type = getRowType(cell.row)

    if (copyValue === null) {
      return
    }

    let updates = []
    let selectionMatches = false
    for (const selection of selections) {
      // TDOO maybe swap x/y, they might be confusing later on (row is y, col is x)
      const xStartIdx = Math.min(selection.start![1], selection.end![1])
      const xEndIdx = Math.max(selection.start![1], selection.end![1])
      if (copyValue.colIdx < xStartIdx || copyValue.colIdx > xEndIdx) {
        continue
      }

      selectionMatches = true
      const yStartIdx = Math.min(selection.start![0], selection.end![0])
      const yEndIdx = Math.max(selection.start![0], selection.end![0])

      for (let i = yStartIdx; i <= yEndIdx; i++) {
        const row = rows[i]
        const rowType = getRowType(row)
        updates.push({
          id: row.id,
          type: rowType === 'folders' ? 'folder' : 'task',
        })
      }
    }

    if (!selectionMatches) {
      toast.error('Operation failed, please paste copied value into matching column.')
    }
    try {
      await updateEntities(
        copyValue!.data.type,
        copyValue!.data.value,
        updates,
        copyValue!.data.isAttrib,
      )
    } catch (e) {
      toast.error('Error updating entity')
    }
    // updateAttribute(row.id, copyValue!.type, copyValue!.value, copyValue!.isAttrib)
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
                      notSelected: !isSelected(absoluteSelections, virtualRow.index, colIdx),
                      selected: isSelected(absoluteSelections, virtualRow.index, colIdx),
                    },
                  )}
                  style={{
                    minWidth: '160px',
                    width: `calc(var(--col-${cell.column.id}-size) * 1px)`,
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'c' && e.ctrlKey) {
                      handleCopy(cell, colIdx)
                    }
                    if (e.key === 'v' && e.ctrlKey) {
                      handlePaste(cell, rows)
                    }
                  }}
                  onMouseDown={(e) => {
                    // @ts-ignore
                    handleMouseDown(e, cell, virtualRow.index, colIdx)
                  }}
                  onMouseUp={(e) => {
                    // @ts-ignore
                    handleMouseUp(e, cell, virtualRow.index, colIdx)
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
                        style={{
                          position: 'relative',
                          minWidth: '160px',
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

export default FlexTable
