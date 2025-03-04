import { useMemo, useRef, useEffect } from 'react'
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
import TableColumns, { BuiltInFieldOptions } from './TableColumns'
import * as Styled from './Table.styled'
import { useCustomColumnWidths, useSyncCustomColumnWidths } from './hooks/useCustomColumnsWidth'
import { CellEditingProvider } from './context/CellEditingContext'
import { SelectionProvider, useSelection } from './context/SelectionContext'
import { getCellId } from './utils/cellUtils'

type Props = {
  tableData: $Any[]
  options: BuiltInFieldOptions
  attribs: $Any[]
  isLoading: boolean
  isExpandable: boolean
  sliceId: string
  expanded: Record<string, boolean>
  updateExpanded: OnChangeFn<ExpandedState>
}

// Component to wrap with both providers
const FlexTableWithProviders = (props: Props) => {
  return (
    <SelectionProvider>
      <CellEditingProvider>
        <FlexTable {...props} />
      </CellEditingProvider>
    </SelectionProvider>
  )
}

const FlexTable = ({
  tableData,
  attribs,
  options,
  isLoading,
  isExpandable,
  sliceId,
  expanded,
  updateExpanded,
}: Props) => {
  //The virtualizer needs to know the scrollable container element
  const tableContainerRef = useRef<HTMLDivElement>(null)

  // Selection context
  const {
    registerGrid,
    isCellSelected,
    isCellFocused,
    startSelection,
    extendSelection,
    endSelection,
    selectCell,
    getCellBorderClasses,
  } = useSelection()

  const columns = TableColumns({
    tableData,
    attribs,
    isLoading,
    isExpandable,
    sliceId,
    options,
    toggleExpanderHandler: () => {
      // track this at some point probably
      console.log('toggleExpanderHandler')
    },
  })

  const table = useReactTable({
    data: tableData,
    columns,
    enableRowSelection: true, //enable row selection for all rows
    getRowId: (row) => row.id,
    enableSubRowSelection: false, //disable sub row selection
    getSubRows: (row) => row.subRows,
    getRowCanExpand: () => true,
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

  // Register grid structure with selection context when rows or columns change
  useEffect(() => {
    const rowIds = rows.map((row) => row.id)
    const colIds = table.getAllLeafColumns().map((col) => col.id)
    registerGrid(rowIds, colIds)
  }, [rows, table.getAllLeafColumns(), registerGrid])

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

  // Improved table body with cell selections and borders
  const tableBody = useMemo(
    () => (
      <tbody style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
        {rowVirtualizer.getVirtualItems().map((virtualRow: $Any) => {
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
              {row.getVisibleCells().map((cell) => {
                const cellId = getCellId(row.id, cell.column.id)
                const borderClasses = getCellBorderClasses(cellId)

                return (
                  <Styled.TableCell
                    tabIndex={0}
                    key={cell.id}
                    className={clsx(
                      cell.column.id === 'folderType' ? 'large' : '',
                      {
                        selected: isCellSelected(cellId),
                        focused: isCellFocused(cellId),
                      },
                      ...borderClasses,
                    )}
                    style={{
                      width: `calc(var(--col-${cell.column.id}-size) * 1px)`,
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'c' && e.ctrlKey) {
                        // handleCopy(
                        //   cell,
                        //   table
                        //     .getHeaderGroups()[0]
                        //     .headers.findIndex((h) => h.id === cell.column.id),
                        // )
                      }
                      if (e.key === 'v' && e.ctrlKey) {
                        // handlePaste(cell, rows)
                      }
                    }}
                    onMouseDown={(e) => {
                      if (e.shiftKey) {
                        // Shift+click extends selection from anchor cell
                        const additive = e.metaKey || e.ctrlKey
                        selectCell(cellId, additive, true) // true for range selection
                      } else {
                        // Normal click starts a new selection
                        startSelection(cellId, e.metaKey || e.ctrlKey)
                      }
                    }}
                    onMouseOver={(e) => {
                      if (e.buttons === 1) {
                        // Left button is pressed during mouse move - drag selection
                        extendSelection(cellId)
                      }
                    }}
                    onMouseUp={() => {
                      endSelection(cellId)
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
    ),
    [
      rowVirtualizer,
      rows,
      startSelection,
      extendSelection,
      endSelection,
      selectCell,
      isCellSelected,
      isCellFocused,
      getCellBorderClasses,
      table.getHeaderGroups,
    ],
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
                          width: `calc(var(--header-${header?.id}-size) * 1px)`,
                        }}
                      >
                        {header.isPlaceholder ? null : (
                          <Styled.TableCellContent
                            className={clsx('bold', {
                              large: header.column.id === 'folderType',
                            })}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            <Styled.ResizedHandler
                              {...{
                                onDoubleClick: () => header.column.resetSize(),
                                onMouseDown: header.getResizeHandler(),
                                onTouchStart: header.getResizeHandler(),
                                className: clsx('resize-handle', {
                                  resizing: header.column.getIsResizing(),
                                }),
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

export default FlexTableWithProviders
