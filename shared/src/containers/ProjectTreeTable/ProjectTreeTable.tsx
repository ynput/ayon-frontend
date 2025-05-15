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
  getSortedRowModel,
  Cell,
  Column,
  Table,
  Header,
  HeaderGroup,
  RowData,
} from '@tanstack/react-table'

// Utility imports
import clsx from 'clsx'

// Type imports
import type { TableRow } from './types/table'

// Component imports
import buildTreeTableColumns, {
  BuildTreeTableColumnsProps,
  DefaultColumns,
  TreeTableExtraColumn,
} from './buildTreeTableColumns'
import * as Styled from './ProjectTreeTable.styled'
import HeaderActionButton from './components/HeaderActionButton'
import EmptyPlaceholder from '../../components/EmptyPlaceholder'

// Context imports
import { useCellEditing } from './context/CellEditingContext'
import { ROW_SELECTION_COLUMN_ID, useSelectionCellsContext } from './context/SelectionCellsContext'
import { ClipboardProvider } from './context/ClipboardContext'
import { useSelectedRowsContext } from './context/SelectedRowsContext'
import { useColumnSettingsContext } from './context/ColumnSettingsContext'

// Hook imports
import useCustomColumnWidthVars from './hooks/useCustomColumnWidthVars'
import usePrefetchFolderTasks from './hooks/usePrefetchFolderTasks'
import useCellContextMenu from './hooks/useCellContextMenu'
import useColumnVirtualization from './hooks/useColumnVirtualization'
import useKeyboardNavigation from './hooks/useKeyboardNavigation'

// Utility function imports
import { getCellId } from './utils/cellUtils'
import { generateLoadingRows, generateDummyAttributes } from './utils/loadingUtils'
import { createPortal } from 'react-dom'
import { Icon } from '@ynput/ayon-react-components'
import { AttributeEnumItem, ProjectTableAttribute, BuiltInFieldOptions } from './types'
import { ToggleExpandAll, useProjectTableContext } from './context/ProjectTableContext'
import { getReadOnlyLists, getTableFieldOptions } from './utils'
import { UpdateTableEntities } from './hooks/useUpdateTableData'

declare module '@tanstack/react-table' {
  interface TableMeta<TData extends RowData> {
    options: BuiltInFieldOptions
    readOnly: ProjectTreeTableProps['readOnly']
    projectName: string
    updateEntities: UpdateTableEntities
    toggleExpandAll: ToggleExpandAll
  }
}

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

export interface ProjectTreeTableProps extends React.HTMLAttributes<HTMLDivElement> {
  scope: string
  sliceId: string
  fetchMoreOnBottomReached: (element: HTMLDivElement | null) => void
  onOpenNew?: (type: 'folder' | 'task') => void
  readOnly?: (DefaultColumns | string)[]
  excludedColumns?: (DefaultColumns | string)[]
  extraColumns?: TreeTableExtraColumn[]
  pt?: {
    container?: React.HTMLAttributes<HTMLDivElement>
    head?: Partial<TableHeadProps>
  }
}

export const ProjectTreeTable = ({
  scope,
  sliceId,
  fetchMoreOnBottomReached,
  onOpenNew,
  readOnly,
  excludedColumns,
  extraColumns,
  pt,
  ...props
}: ProjectTreeTableProps) => {
  const {
    columnVisibility,
    columnVisibilityUpdater,
    columnPinning,
    columnPinningUpdater,
    columnOrder,
    columnOrderUpdater,
    columnSizing,
    columnSizingUpdater,
  } = useColumnSettingsContext()

  const {
    projectInfo,
    tableData,
    attribFields,
    entitiesMap,
    users,
    isLoading,
    isInitialized,
    expanded,
    projectName,
    updateExpanded,
    toggleExpandAll,
    sorting,
    updateSorting,
    showHierarchy,
  } = useProjectTableContext()

  const { statuses = [], folderTypes = [], taskTypes = [], tags = [] } = projectInfo || {}
  const options: BuiltInFieldOptions = useMemo(
    () =>
      getTableFieldOptions({
        users,
        statuses,
        folderTypes,
        taskTypes,
        tags,
      }),
    [users, statuses, folderTypes, taskTypes],
  )

  //The virtualizer needs to know the scrollable container element
  const tableContainerRef = useRef<HTMLDivElement>(null)

  // Selection context
  const { registerGrid } = useSelectionCellsContext()

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
      attribFields,
      showHierarchy && tableData.length > 0 ? Math.min(tableRowsCount, 50) : 50,
    )
    return { loadingAttrib, loadingRows }
  }, [attribFields, tableData, showHierarchy, tableContainerRef.current])

  const showLoadingRows = !isInitialized || isLoading

  // Format readonly columns and attributes
  const { readOnlyColumns, readOnlyAttribs } = useMemo(
    () => getReadOnlyLists(attribFields, readOnly),
    [attribFields, readOnly],
  )

  const { updateEntities } = useCellEditing()

  const columnAttribs = useMemo(
    () => (isInitialized ? attribFields : loadingAttrib),
    [attribFields, loadingAttrib, isInitialized],
  )
  const columns = useMemo(
    () =>
      buildTreeTableColumns({
        attribs: columnAttribs,
        showHierarchy,
        options,
        extraColumns,
        excluded: excludedColumns,
      }),
    [columnAttribs, showHierarchy, options, extraColumns, excludedColumns],
  )

  const table = useReactTable({
    data: showLoadingRows ? loadingRows : tableData,
    columns,
    defaultColumn: {
      minSize: 50,
      size: 150,
    },
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
    onColumnSizingChange: columnSizingUpdater,
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
    meta: {
      projectName,
      options,
      readOnly: readOnlyColumns,
      updateEntities,
      toggleExpandAll,
    },
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

  const attribByField = useMemo(() => {
    return attribFields.reduce((acc: Record<string, AttributeEnumItem[]>, attrib) => {
      if (attrib.data?.enum?.length) {
        acc[attrib.name] = attrib.data?.enum
      }
      return acc
    }, {})
  }, [attribFields])

  return (
    <ClipboardProvider
      entitiesMap={entitiesMap}
      columnEnums={{ ...options, ...attribByField }}
      columnReadOnly={readOnlyAttribs}
    >
      <Styled.TableWrapper {...props}>
        <Styled.TableContainer
          ref={tableContainerRef}
          style={{ height: '100%', padding: 0 }}
          onScroll={(e) => fetchMoreOnBottomReached(e.currentTarget)}
          {...pt?.container}
          className={clsx('table-container', pt?.container?.className)}
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
              {...pt?.head}
            />
            <TableBody
              columnVirtualizer={columnVirtualizer}
              table={table}
              tableContainerRef={tableContainerRef}
              virtualPaddingLeft={virtualPaddingLeft}
              virtualPaddingRight={virtualPaddingRight}
              showHierarchy={showHierarchy}
              attribs={attribFields}
              onOpenNew={onOpenNew}
            />
          </table>
        </Styled.TableContainer>
      </Styled.TableWrapper>
    </ClipboardProvider>
  )
}

interface TableHeadProps extends React.HTMLAttributes<HTMLTableSectionElement> {
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
  ...props
}: TableHeadProps) => {
  return (
    <Styled.TableHeader {...props}>
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
            canSort={header.column.getCanSort()}
            canFilter={header.column.getCanFilter()}
            canHide={header.column.getCanHide()}
            canPin={header.column.getCanPin()}
            canResize={header.column.getCanResize()}
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
  canSort?: boolean
  canFilter?: boolean
  canHide?: boolean
  canPin?: boolean
  canResize?: boolean
  isReadOnly?: boolean
}

const TableHeadCell = ({
  header,
  isLoading,
  canFilter,
  canHide,
  canSort,
  canPin,
  canResize,
  isReadOnly,
}: TableHeadCellProps) => {
  const { column } = header

  return (
    <Styled.HeaderCell
      className={clsx(header.id, 'shimmer-dark', {
        loading: isLoading,
        'last-pinned-left': column.getIsPinned() === 'left' && column.getIsLastColumn('left'),
      })}
      key={header.id}
      style={{
        ...getCommonPinningStyles(column),
        width: `calc(var(--header-${header?.id}-size) * 1px)`,
      }}
    >
      {header.isPlaceholder ? null : (
        <Styled.TableCellContent className={clsx('bold')}>
          {flexRender(column.columnDef.header, header.getContext())}
          {isReadOnly && (
            <Icon icon="lock" data-tooltip={'You only have permission to read this column.'} />
          )}

          <Styled.HeaderButtons className="actions">
            {/* COLUMN HIDING */}
            {canHide && (
              <HeaderActionButton
                icon="visibility_off"
                selected={!column.getIsVisible()}
                onClick={column.getToggleVisibilityHandler()}
              />
            )}
            {/* COLUMN PINNING */}
            {canPin && (
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
            )}

            {/* COLUMN SORTING */}
            {canSort && (
              <HeaderActionButton
                icon={'sort'}
                style={{
                  transform: (column.getIsSorted() as string) === 'asc' ? 'scaleY(-1)' : undefined,
                }}
                onClick={column.getToggleSortingHandler()}
                selected={!!column.getIsSorted()}
              />
            )}
          </Styled.HeaderButtons>
          {canResize && (
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
  attribs: ProjectTableAttribute[]
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
      createPortal(<EmptyPlaceholder message="No items found" />, tableContainerRef.current)
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
  } = useSelectionCellsContext()

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
