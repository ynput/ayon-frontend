import { useMemo, useRef, useEffect, memo, CSSProperties } from 'react'
import { useVirtualizer, VirtualItem, Virtualizer } from '@tanstack/react-virtual'
// TanStack Table imports
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getExpandedRowModel,
  filterFns,
  flexRender,
  Row,
  OnChangeFn,
  getSortedRowModel,
  Cell,
  Column,
  functionalUpdate,
  ColumnSizingState,
  Table,
  Header,
  HeaderGroup,
  ExpandedState,
  SortingState,
} from '@tanstack/react-table'

// Utility imports
import clsx from 'clsx'

// Type imports
import type { FolderNodeMap, TableRow, TaskNodeMap } from './types/table'

// Component imports
import ProjectTreeTableColumns from './ProjectTreeTableColumns'
import * as Styled from './ProjectTreeTable.styled'
import HeaderActionButton from './components/HeaderActionButton'
import EmptyPlaceholder from '../EmptyPlaceholder'

// Context imports
import { CellEditingProvider, useCellEditing } from './context/CellEditingContext'
import { ROW_SELECTION_COLUMN_ID, useSelectionContext } from './context/SelectionContext'
import { ClipboardProvider } from './context/ClipboardContext'
import { useSelectedRowsContext } from './context/SelectedRowsContext'
import { useColumnSettings } from './context/ColumnSettingsContext'

// Hook imports
import useCustomColumnWidthVars from './hooks/useCustomColumnWidthVars'
import usePrefetchFolderTasks from './hooks/usePrefetchFolderTasks'
import { useLocalStorage } from '../hooks'
import useCellContextMenu from './hooks/useCellContextMenu'
import useColumnVirtualization from './hooks/useColumnVirtualization'
import useKeyboardNavigation from './hooks/useKeyboardNavigation'

// Utility function imports
import { getCellId } from './utils/cellUtils'
import { generateLoadingRows, generateDummyAttributes } from './utils/loadingUtils'
import { createPortal } from 'react-dom'
import { Icon } from '@ynput/ayon-react-components'
import { AttributeEnumItem, AttributeWithPermissions, BuiltInFieldOptions } from './types'
import { useProjectTableContext } from './context/ProjectTableContext'

//These are the important styles to make sticky column pinning work!
//Apply styles like this using your CSS strategy of choice with this kind of logic to head cells, data cells, footer cells, etc.
//View the index.css file for more needed styles such as border-collapse: separate
const getCommonPinningStyles = (column: Column<TableRow, unknown>): CSSProperties => {
  const isPinned = column.getIsPinned()

  return {
    left: isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
    right: isPinned === 'right' ? `${column.getAfter('right')}px` : undefined,
    position: isPinned ? 'sticky' : 'relative',
    width: column.getSize(),
    zIndex: isPinned ? 100 : 0,
  }
}

type Props = {
  projectName: string
  scope: string
  options: BuiltInFieldOptions
  attribs: AttributeWithPermissions[]
  sliceId: string
  // metadata
  tasksMap: TaskNodeMap
  foldersMap: FolderNodeMap
  fetchMoreOnBottomReached: (element: HTMLDivElement | null) => void
  onOpenNew?: (type: 'folder' | 'task') => void
}

// Component to wrap with all providers
const FlexTableWithProviders = (props: Props) => {
  // convert attribs to object
  const attribByField = useMemo(() => {
    return props.attribs.reduce((acc: Record<string, AttributeEnumItem[]>, attrib) => {
      if (attrib.data?.enum?.length) {
        acc[attrib.name] = attrib.data?.enum
      }
      return acc
    }, {})
  }, [props.attribs])

  return (
    <ClipboardProvider
      foldersMap={props.foldersMap}
      tasksMap={props.tasksMap}
      columnEnums={{ ...props.options, ...attribByField }}
      columnReadOnly={props.attribs
        .filter((attrib) => attrib.readOnly)
        .map((attrib) => attrib.name)}
    >
      <FlexTable {...props} />
    </ClipboardProvider>
  )
}

const FlexTable = ({
  scope,
  attribs,
  options,
  sliceId,
  fetchMoreOnBottomReached,
  onOpenNew,
}: Props) => {
  const {
    columnVisibility,
    columnVisibilityUpdater,
    columnPinning,
    columnPinningUpdater,
    columnOrder,
    columnOrderUpdater,
  } = useColumnSettings()

  const {
    tableData,
    isLoading,
    isInitialized,
    expanded,
    updateExpanded,
    toggleExpandAll,
    toggleExpanded,
    sorting,
    updateSorting,
    showHierarchy,
  } = useProjectTableContext()

  //The virtualizer needs to know the scrollable container element
  const tableContainerRef = useRef<HTMLDivElement>(null)

  // Selection context
  const { registerGrid } = useSelectionContext()

  // COLUMN SIZING
  const [columnSizing, setColumnSizing] = useLocalStorage<ColumnSizingState>(
    `column-widths-${scope}`,
    {},
  )

  const updateColumnSizing: OnChangeFn<ColumnSizingState> = (columnSizingUpdater) => {
    setColumnSizing(functionalUpdate(columnSizingUpdater, columnSizing))
  }

  //a check on mount and after a fetch to see if the table is already scrolled to the bottom and immediately needs to fetch more data
  useEffect(() => {
    fetchMoreOnBottomReached(tableContainerRef.current)
  }, [fetchMoreOnBottomReached])

  // generate loading attrib and rows
  const { loadingAttrib, loadingRows } = useMemo(() => {
    // count the number of children in tbody
    const tableRowsCount = tableContainerRef.current?.querySelectorAll('tbody tr').length || 0
    const loadingAttrib = generateDummyAttributes()
    const loadingRows = generateLoadingRows(
      attribs,
      showHierarchy && tableData.length > 0 ? Math.min(tableRowsCount, 50) : 50,
    )
    return { loadingAttrib, loadingRows }
  }, [attribs, tableData, showHierarchy, tableContainerRef.current])

  const showLoadingRows = !isInitialized || isLoading

  const columns = ProjectTreeTableColumns({
    tableData: showLoadingRows ? loadingRows : tableData,
    columnSizing,
    attribs: isInitialized ? attribs : loadingAttrib,
    isLoading: !isInitialized,
    showHierarchy,
    sliceId,
    options,
    toggleExpandAll: (id: string) => toggleExpandAll([id]),
    toggleExpanded: (id: string) => toggleExpanded(id),
  })

  const table = useReactTable({
    data: showLoadingRows ? loadingRows : tableData,
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
    // EXPANDABLE
    onExpandedChange: updateExpanded,
    // SORTING
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: updateSorting,
    columnResizeMode: 'onChange',
    onColumnPinningChange: columnPinningUpdater,
    onColumnSizingChange: updateColumnSizing,
    onColumnVisibilityChange: columnVisibilityUpdater,
    onColumnOrderChange: columnOrderUpdater,
    // @ts-ignore
    filterFns,
    state: {
      expanded,
      sorting,
      columnPinning: {
        left: [ROW_SELECTION_COLUMN_ID, ...(columnPinning.left || [])],
        right: columnPinning.right,
      },
      columnSizing,
      columnVisibility,
      columnOrder,
    },
    enableSorting: true,
  })

  const { rows } = table.getRowModel()

  // Register grid structure with selection context when rows or columns change
  useEffect(() => {
    const rowIds = rows.map((row) => row.id)
    const colIds = table.getAllLeafColumns().map((col) => col.id)
    const colIdsSortedByPinning = [...colIds].sort((a, b) => {
      if (ROW_SELECTION_COLUMN_ID === b) return 1
      const colA = columnPinning.left?.includes(a) ? 0 : 1
      const colB = columnPinning.left?.includes(b) ? 0 : 1
      return colA - colB
    })

    registerGrid(rowIds, colIdsSortedByPinning)
  }, [rows, table.getAllLeafColumns(), columnPinning, ROW_SELECTION_COLUMN_ID, registerGrid])

  const visibleColumns = table.getVisibleLeafColumns()

  // Use the column virtualization hook
  const { columnVirtualizer, virtualPaddingLeft, virtualPaddingRight } = useColumnVirtualization({
    visibleColumns,
    tableContainerRef,
    columnPinning,
  })

  const columnSizeVars = useCustomColumnWidthVars(table, columnSizing)
  const readOnlyColumns = useMemo(
    () => attribs.filter((attrib) => attrib.readOnly).map((attrib) => 'attrib_' + attrib.name),
    [attribs],
  )

  return (
    <Styled.TableWrapper>
      <Styled.TableContainer
        ref={tableContainerRef}
        style={{ height: '100%', padding: 0 }}
        onScroll={(e) => fetchMoreOnBottomReached(e.currentTarget)}
        className="table-container"
      >
        <table
          style={{
            display: 'grid',
            borderCollapse: 'collapse',
            userSelect: 'none',
            ...columnSizeVars,
            width: table.getTotalSize(),
          }}
        >
          <TableHead
            columnVirtualizer={columnVirtualizer}
            table={table}
            virtualPaddingLeft={virtualPaddingLeft}
            virtualPaddingRight={virtualPaddingRight}
            isLoading={isLoading}
            readOnlyColumns={readOnlyColumns}
          />
          <TableBody
            columnVirtualizer={columnVirtualizer}
            table={table}
            tableContainerRef={tableContainerRef}
            virtualPaddingLeft={virtualPaddingLeft}
            virtualPaddingRight={virtualPaddingRight}
            showHierarchy={showHierarchy}
            attribs={attribs}
            onOpenNew={onOpenNew}
          />
        </table>
      </Styled.TableContainer>
    </Styled.TableWrapper>
  )
}

interface TableHeadProps {
  columnVirtualizer: Virtualizer<HTMLDivElement, HTMLTableCellElement>
  table: Table<TableRow>
  virtualPaddingLeft: number | undefined
  virtualPaddingRight: number | undefined
  isLoading: boolean
  readOnlyColumns?: string[]
}

const TableHead = ({
  columnVirtualizer,
  table,
  virtualPaddingLeft,
  virtualPaddingRight,
  isLoading,
  readOnlyColumns,
}: TableHeadProps) => {
  return (
    <Styled.TableHeader>
      {table.getHeaderGroups().map((headerGroup) => (
        <TableHeadRow
          key={headerGroup.id}
          columnVirtualizer={columnVirtualizer}
          headerGroup={headerGroup}
          virtualPaddingLeft={virtualPaddingLeft}
          virtualPaddingRight={virtualPaddingRight}
          isLoading={isLoading}
          readOnlyColumns={readOnlyColumns}
        />
      ))}
    </Styled.TableHeader>
  )
}

interface TableHeadRowProps {
  columnVirtualizer: Virtualizer<HTMLDivElement, HTMLTableCellElement>
  headerGroup: HeaderGroup<TableRow>
  virtualPaddingLeft: number | undefined
  virtualPaddingRight: number | undefined
  isLoading: boolean
  readOnlyColumns?: string[]
}

const TableHeadRow = ({
  columnVirtualizer,
  headerGroup,
  virtualPaddingLeft,
  virtualPaddingRight,
  isLoading,
  readOnlyColumns,
}: TableHeadRowProps) => {
  const virtualColumns = columnVirtualizer.getVirtualItems()
  return (
    <Styled.ColumnHeader key={headerGroup.id} style={{ display: 'flex' }}>
      {virtualPaddingLeft ? (
        //fake empty column to the left for virtualization scroll padding
        <th style={{ display: 'flex', width: virtualPaddingLeft }} />
      ) : null}
      {virtualColumns.map((virtualColumn) => {
        const header = headerGroup.headers[virtualColumn.index]
        return (
          <TableHeadCell
            key={header.id}
            header={header}
            isLoading={isLoading}
            isReadOnly={readOnlyColumns?.includes(header.id)}
          />
        )
      })}
      {virtualPaddingRight ? (
        //fake empty column to the right for virtualization scroll padding
        <th style={{ display: 'flex', width: virtualPaddingRight }} />
      ) : null}
    </Styled.ColumnHeader>
  )
}

interface TableHeadCellProps {
  header: Header<TableRow, unknown>
  isLoading: boolean
  isReadOnly?: boolean
}

const TableHeadCell = ({ header, isLoading, isReadOnly }: TableHeadCellProps) => {
  const { column } = header
  const isRowSelectionColumn = column.id === ROW_SELECTION_COLUMN_ID

  return (
    <Styled.HeaderCell
      className={clsx(header.id, 'shimmer-dark', {
        loading: isLoading,
        large: column.id === 'folderType',
        'last-pinned-left': column.getIsPinned() === 'left' && column.getIsLastColumn('left'),
      })}
      key={header.id}
      style={{
        ...getCommonPinningStyles(column),
        width: `calc(var(--header-${header?.id}-size) * 1px)`,
      }}
    >
      {header.isPlaceholder ? null : (
        <Styled.TableCellContent
          className={clsx('bold', {
            large: column.id === 'folderType',
          })}
        >
          {flexRender(column.columnDef.header, header.getContext())}
          {isReadOnly && (
            <Icon icon="lock" data-tooltip={'You only have permission to read this column.'} />
          )}

          <Styled.HeaderButtons className="actions">
            {/* COLUMN HIDING */}
            <HeaderActionButton
              icon="visibility_off"
              selected={!column.getIsVisible()}
              onClick={column.getToggleVisibilityHandler()}
            />
            {/* COLUMN SORTING */}
            <HeaderActionButton
              icon="push_pin"
              selected={header.column.getIsPinned() === 'left'}
              onClick={() => {
                if (header.column.getIsPinned() === 'left') {
                  header.column.pin(false)
                } else {
                  header.column.pin('left')
                }
              }}
            />
            {/* COLUMN PINNING */}
            <HeaderActionButton
              icon={'sort'}
              style={{
                transform: (column.getIsSorted() as string) === 'asc' ? 'scaleY(-1)' : undefined,
              }}
              onClick={column.getToggleSortingHandler()}
              selected={!!column.getIsSorted()}
            />
          </Styled.HeaderButtons>
          {!isRowSelectionColumn && (
            <Styled.ResizedHandler
              {...{
                onDoubleClick: () => column.resetSize(),
                onMouseDown: header.getResizeHandler(),
                onTouchStart: header.getResizeHandler(),
                className: clsx('resize-handle', {
                  resizing: column.getIsResizing(),
                }),
              }}
            />
          )}
        </Styled.TableCellContent>
      )}
    </Styled.HeaderCell>
  )
}

interface TableBodyProps {
  columnVirtualizer: Virtualizer<HTMLDivElement, HTMLTableCellElement>
  table: Table<TableRow>
  tableContainerRef: React.RefObject<HTMLDivElement>
  showHierarchy: boolean
  virtualPaddingLeft: number | undefined
  virtualPaddingRight: number | undefined
  attribs: AttributeWithPermissions[]
  onOpenNew?: (type: 'folder' | 'task') => void
}

const TableBody = ({
  columnVirtualizer,
  table,
  tableContainerRef,
  showHierarchy,
  virtualPaddingLeft,
  virtualPaddingRight,
  attribs,
  onOpenNew,
}: TableBodyProps) => {
  const { handleTableBodyContextMenu } = useCellContextMenu({ attribs, onOpenNew })

  const { handlePreFetchTasks } = usePrefetchFolderTasks()

  const { rows } = table.getRowModel()

  const rowVirtualizer = useVirtualizer<HTMLDivElement, HTMLTableRowElement>({
    count: rows.length,
    estimateSize: () => (showHierarchy ? 36 : 40), //estimate row height for accurate scrollbar dragging
    getScrollElement: () => tableContainerRef.current,
    //measure dynamic row height, except in firefox because it measures table border height incorrectly
    measureElement:
      typeof window !== 'undefined' && navigator.userAgent.indexOf('Firefox') === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
    overscan: 5,
  })

  const virtualRows = rowVirtualizer.getVirtualItems()

  useKeyboardNavigation()

  return virtualRows.length ? (
    <tbody
      style={{
        height: `${rowVirtualizer.getTotalSize()}px`,
        position: 'relative',
        display: 'grid',
      }}
      onContextMenu={handleTableBodyContextMenu}
      onMouseOver={(e) => {
        handlePreFetchTasks(e)
      }}
    >
      {virtualRows.map((virtualRow) => {
        const row = rows[virtualRow.index] as Row<TableRow>
        return (
          <TableBodyRow
            key={row.id}
            columnVirtualizer={columnVirtualizer}
            row={row}
            rowVirtualizer={rowVirtualizer}
            virtualPaddingLeft={virtualPaddingLeft}
            virtualPaddingRight={virtualPaddingRight}
            virtualRow={virtualRow}
            showHierarchy={showHierarchy}
          />
        )
      })}
    </tbody>
  ) : (
    tableContainerRef.current &&
      createPortal(
        <EmptyPlaceholder message="No folders or tasks found" />,
        tableContainerRef.current,
      )
  )
}

interface TableBodyRowProps {
  columnVirtualizer: Virtualizer<HTMLDivElement, HTMLTableCellElement>
  row: Row<TableRow>
  rowVirtualizer: Virtualizer<HTMLDivElement, HTMLTableRowElement>
  virtualPaddingLeft: number | undefined
  virtualPaddingRight: number | undefined
  virtualRow: VirtualItem
  showHierarchy: boolean
}

const TableBodyRow = ({
  columnVirtualizer,
  row,
  rowVirtualizer,
  virtualPaddingLeft,
  virtualPaddingRight,
  virtualRow,
  showHierarchy,
}: TableBodyRowProps) => {
  // We should do this so that we don't re-render every time anything in projectTableContext changes
  const visibleCells = row.getVisibleCells()
  const virtualColumns = columnVirtualizer.getVirtualItems()

  return (
    <Styled.TR
      data-index={virtualRow.index} //needed for dynamic row height measurement
      ref={(node) => rowVirtualizer.measureElement(node)} //measure dynamic row height
      key={row.id}
      style={{
        transform: `translateY(${virtualRow.start}px)`, //this should always be a `style` as it changes on scroll
      }}
    >
      {virtualPaddingLeft ? (
        //fake empty column to the left for virtualization scroll padding
        <td style={{ display: 'flex', width: virtualPaddingLeft }} />
      ) : null}
      {virtualColumns.map((vc) => {
        const cell = visibleCells[vc.index]
        const cellId = getCellId(row.id, cell.column.id)
        return (
          <TableCellMemo
            cell={cell}
            cellId={cellId}
            rowId={row.id}
            key={cell.id}
            showHierarchy={showHierarchy}
          />
        )
      })}

      {virtualPaddingRight ? (
        //fake empty column to the right for virtualization scroll padding
        <td style={{ display: 'flex', width: virtualPaddingRight }} />
      ) : null}
    </Styled.TR>
  )
}

interface TableCellProps {
  cell: Cell<TableRow, unknown>
  cellId: string
  rowId: string
  className?: string
  showHierarchy: boolean
}

const TableCell = ({ cell, rowId, cellId, className, showHierarchy, ...props }: TableCellProps) => {
  const {
    isCellSelected,
    isCellFocused,
    startSelection,
    extendSelection,
    endSelection,
    selectCell,
    getCellBorderClasses,
  } = useSelectionContext()

  const { isRowSelected } = useSelectedRowsContext()

  const { isEditing } = useCellEditing()

  const borderClasses = getCellBorderClasses(cellId)

  const isPinned = cell.column.getIsPinned()
  const isLastLeftPinnedColumn = isPinned === 'left' && cell.column.getIsLastColumn('left')
  const isRowSelectionColumn = cell.column.id === ROW_SELECTION_COLUMN_ID

  return (
    <Styled.TableCell
      {...props}
      tabIndex={0}
      key={cell.id}
      $isLastPinned={isLastLeftPinnedColumn} // is this column the last pinned column? Custom styling for borders.
      className={clsx(
        cell.column.id,
        cell.column.id === 'folderType' ? 'large' : '',
        {
          selected: isCellSelected(cellId),
          focused: isCellFocused(cellId),
          editing: isEditing(cellId),
          'last-pinned-left': isLastLeftPinnedColumn,
          'selected-row': isRowSelected(rowId),
          task: cell.row.original.entityType === 'task',
        },
        className,
        ...borderClasses,
      )}
      style={{
        ...getCommonPinningStyles(cell.column),
        width: `calc(var(--col-${cell.column.id}-size) * 1px)`,
        height: showHierarchy ? 36 : 40,
      }}
      onMouseDown={(e) => {
        // Only process left clicks (button 0), ignore right clicks
        if (e.button !== 0) return

        // check we are not clicking on expander
        if ((e.target as HTMLElement).closest('.expander')) return
        const additive = e.metaKey || e.ctrlKey || isRowSelectionColumn
        if (e.shiftKey) {
          // Shift+click extends selection from anchor cell
          selectCell(cellId, additive, true) // true for range selection
        } else {
          // Normal click starts a new selection
          startSelection(cellId, additive)
        }
      }}
      onMouseOver={(e) => {
        if (e.buttons === 1) {
          // Left button is pressed during mouse move - drag selection
          extendSelection(cellId, isRowSelectionColumn)
        }
      }}
      onMouseUp={() => {
        endSelection(cellId)
      }}
      onDoubleClick={(e) => {
        if (cell.column.id === 'name') {
          // select the row by selecting the row-selection cell
          const rowSelectionCellId = getCellId(cell.row.id, ROW_SELECTION_COLUMN_ID)
          if (!isCellSelected(rowSelectionCellId)) {
            const additive = e.metaKey || e.ctrlKey
            selectCell(rowSelectionCellId, additive, false)
          }
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault()
        // if the cell is not selected, select it and deselect all others
        if (!isCellSelected(cellId)) {
          selectCell(cellId, false, false)
        }
      }}
    >
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </Styled.TableCell>
  )
}

const TableCellMemo = memo(TableCell)

export default FlexTableWithProviders
