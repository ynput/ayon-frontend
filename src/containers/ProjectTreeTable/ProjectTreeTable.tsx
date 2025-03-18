import { useMemo, useRef, useEffect, memo, CSSProperties } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
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
  ColumnPinningState,
  Column,
  functionalUpdate,
  ColumnSizingState,
} from '@tanstack/react-table'

// Utility imports
import clsx from 'clsx'

// Type imports
import { $Any } from '@types'
import { AttributeEnumItem, AttributeModel } from '@api/rest/attributes'
import { FolderNodeMap, TableRow, TaskNodeMap } from './utils/types'

// Component imports
import ProjectTreeTableColumns, { BuiltInFieldOptions } from './ProjectTreeTableColumns'
import * as Styled from './ProjectTreeTable.styled'
import HeaderActionButton from './components/HeaderActionButton'

// Context imports
import { CellEditingProvider, useCellEditing } from './context/CellEditingContext'
import { useSelection } from './context/SelectionContext'
import { ClipboardProvider, useClipboard } from './context/ClipboardContext'

// Hook imports
import useCustomColumnWidthVars from './hooks/useCustomColumnWidthVars'

// Utility function imports
import { getCellId, parseCellId } from './utils/cellUtils'
import useLocalStorage from '@hooks/useLocalStorage'
import { useProjectTableContext } from '@containers/ProjectTreeTable/context/ProjectTableContext'
import useCreateContext from '@hooks/useCreateContext'
import { getPlatformShortcutKey, KeyMode } from '@helpers/platform'
import { NewEntityType, useNewEntityContext } from '@context/NewEntityContext'
import useDeleteEntities from './hooks/useDeleteEntities'

//These are the important styles to make sticky column pinning work!
//Apply styles like this using your CSS strategy of choice with this kind of logic to head cells, data cells, footer cells, etc.
//View the index.css file for more needed styles such as border-collapse: separate
const getCommonPinningStyles = (column: Column<TableRow, unknown>): CSSProperties => {
  const isPinned = column.getIsPinned()
  const isLastLeftPinnedColumn = isPinned === 'left' && column.getIsLastColumn('left')
  // const isFirstRightPinnedColumn = isPinned === 'right' && column.getIsFirstColumn('right')

  const boxShadow = isLastLeftPinnedColumn
    ? 'inset 1px -1px 0 0 var(--md-sys-color-surface-container), inset -2px 0 0 0 var(--md-sys-color-surface-container)'
    : undefined

  return {
    boxShadow: boxShadow,
    left: isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
    right: isPinned === 'right' ? `${column.getAfter('right')}px` : undefined,
    position: isPinned ? 'sticky' : 'relative',
    width: column.getSize(),
    zIndex: isPinned ? 100 : 0,
  }
}

type ContextEvent = React.MouseEvent<HTMLTableSectionElement, MouseEvent>

type Props = {
  scope: string
  tableData: TableRow[]
  options: BuiltInFieldOptions
  attribs: AttributeModel[]
  isLoading: boolean
  isExpandable: boolean
  sliceId: string
  // metadata
  tasksMap: TaskNodeMap
  foldersMap: FolderNodeMap
  fetchMoreOnBottomReached: (element: HTMLDivElement | null) => void
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
    <CellEditingProvider>
      <ClipboardProvider
        foldersMap={props.foldersMap}
        tasksMap={props.tasksMap}
        columnEnums={{ ...props.options, ...attribByField }}
      >
        <FlexTable {...props} />
      </ClipboardProvider>
    </CellEditingProvider>
  )
}

type TableCellProps = {
  cell: Cell<TableRow, unknown>
  cellId: string
  isPinned: boolean | string
}

const TableCell = ({ cell, cellId }: TableCellProps) => {
  const {
    isCellSelected,
    isCellFocused,
    startSelection,
    extendSelection,
    endSelection,
    selectCell,
    getCellBorderClasses,
  } = useSelection()

  const { isEditing } = useCellEditing()

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
          editing: isEditing(cellId),
        },
        ...borderClasses,
      )}
      style={{
        ...getCommonPinningStyles(cell.column),
        width: `calc(var(--col-${cell.column.id}-size) * 1px)`,
      }}
      onMouseDown={(e) => {
        // Only process left clicks (button 0), ignore right clicks
        if (e.button !== 0) return

        // check we are not clicking on folder/task name
        if ((e.target as HTMLElement).closest('.name-content')) return
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

type TableCellsProps = {
  row: Row<TableRow>
  columnPinning: ColumnPinningState // purely for memoization
}

const TableCells = ({ row }: TableCellsProps) => {
  return row.getVisibleCells().map((cell) => {
    const cellId = getCellId(row.id, cell.column.id)

    return (
      <TableCellMemo
        cell={cell}
        cellId={cellId}
        key={cell.id}
        isPinned={cell.column.getIsPinned()}
      />
    )
  })
}

const TableCellsMemo = memo(TableCells)

const FlexTable = ({
  scope,
  tableData,
  attribs,
  options,
  isLoading,
  isExpandable,
  sliceId,
  fetchMoreOnBottomReached,
}: Props) => {
  //The virtualizer needs to know the scrollable container element
  const tableContainerRef = useRef<HTMLDivElement>(null)

  const {
    expanded,
    updateExpanded,
    sorting,
    updateSorting,
    showHierarchy,
    projectInfo,
    projectName,
    getEntityById,
  } = useProjectTableContext()

  // COLUMN PINNING
  const [columnPinning, setColumnPinning] = useLocalStorage<ColumnPinningState>(
    `column-pinning-${scope}`,
    { left: ['name'] },
  )

  const updateColumnPinning: OnChangeFn<ColumnPinningState> = (columnPinningUpdater) => {
    setColumnPinning(functionalUpdate(columnPinningUpdater, columnPinning))
  }

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

  // Selection context
  const { registerGrid, isCellSelected, selectedCells, clearSelection } = useSelection()

  // clipboard context
  const { copyToClipboard, exportCSV, pasteFromClipboard } = useClipboard()

  // new entity context
  const { onOpenNew } = useNewEntityContext()

  // update entity context
  const { inheritFromParent } = useCellEditing()

  const columns = ProjectTreeTableColumns({
    tableData,
    columnSizing,
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
    // EXPANDABLE
    onExpandedChange: updateExpanded,
    // SORTING
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: updateSorting,
    columnResizeMode: 'onChange',
    onColumnPinningChange: updateColumnPinning,
    onColumnSizingChange: updateColumnSizing,
    // @ts-ignore
    filterFns,
    state: {
      expanded,
      sorting,
      columnPinning,
      columnSizing,
    },
    enableSorting: true,
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
    overscan: 20,
  })

  const columnSizeVars = useCustomColumnWidthVars(table, columnSizing)

  const deleteEntities = useDeleteEntities({})

  const [cellContextMenuShow] = useCreateContext()

  const cellContextMenuItems = (_e: ContextEvent, id: string, selected: string[]) => {
    const items: {
      label: string
      icon: string
      shortcut?: string
      danger?: boolean
      command: () => void
    }[] = [
      {
        label: 'Copy',
        icon: 'content_copy',
        shortcut: getPlatformShortcutKey('c', [KeyMode.Ctrl]),
        command: () => copyToClipboard(selected),
      },
    ]

    // get the entity
    const entityId = parseCellId(id)?.rowId
    if (!entityId) return items

    const isColName = parseCellId(id)?.colId === 'name'

    if (!isColName) {
      items.push({
        label: 'Paste',
        icon: 'content_paste',
        shortcut: getPlatformShortcutKey('v', [KeyMode.Ctrl]),
        command: () => pasteFromClipboard(selected),
      })
    }

    const entitiesToInherit = selected.reduce((acc, cellId) => {
      const { rowId, colId } = parseCellId(cellId) || {}
      if (!rowId || !colId || !colId.startsWith('attrib_')) return acc

      const entity = getEntityById(rowId)
      if (!entity) return acc

      const attribName = colId.replace('attrib_', '')

      // Check if this attribute is owned by the entity (not inherited)
      if (entity.ownAttrib?.includes(attribName)) {
        // Find existing entry or create new one
        const existingIndex = acc.findIndex((item) => item.id === rowId)

        if (existingIndex >= 0) {
          // Add to existing entity's attribs if not already there
          if (!acc[existingIndex].attribs.includes(attribName)) {
            acc[existingIndex].attribs.push(attribName)
          }
        } else {
          // Create new entity entry
          acc.push({
            id: rowId,
            type: 'folderId' in entity ? 'task' : 'folder',
            attribs: [attribName],
          })
        }
      }

      return acc
    }, [] as { id: string; type: string; attribs: string[] }[])

    // Update the inherit from parent command to use the entities we collected
    if (entitiesToInherit.length && showHierarchy) {
      // NOTE: This should work not in hierarchy mode, but for some reason it doesn't
      items.push({
        label: 'Inherit from parent',
        icon: 'disabled_by_default',
        command: () => inheritFromParent(entitiesToInherit),
      })
    }

    items.push({
      label: 'Export selection',
      icon: 'download',
      command: () => exportCSV(selected, projectName),
    })

    const openNewEntity = (type: NewEntityType) => onOpenNew(type, projectInfo)

    if (isColName) {
      if (showHierarchy) {
        items.push({
          label: 'Create folder',
          icon: 'create_new_folder',
          command: () => openNewEntity('folder'),
        })

        items.push({
          label: 'Create root folder',
          icon: 'create_new_folder',
          command: () => {
            // deselect all
            clearSelection()
            openNewEntity('folder')
          },
        })

        items.push({
          label: 'Create task',
          icon: 'add_task',
          command: () => openNewEntity('task'),
        })
      }

      items.push({
        label: 'Delete',
        icon: 'delete',
        danger: true,
        command: () => deleteEntities(selected),
      })
    }

    return items
  }

  const handleTableBodyContextMenu = (e: ContextEvent) => {
    const target = e.target as HTMLElement
    const tdEl = target.closest('td')
    // get id of first child of td
    const cellId = tdEl?.firstElementChild?.id

    if (cellId) {
      let currentSelectedCells = Array.from(selectedCells)
      if (!isCellSelected(cellId)) {
        currentSelectedCells = [cellId]
      }
      cellContextMenuShow(e, cellContextMenuItems(e, cellId, currentSelectedCells))
    }
  }

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
            borderCollapse: 'collapse',
            userSelect: 'none',
            ...columnSizeVars,
            width: table.getTotalSize(),
          }}
        >
          <Styled.TableHeader>
            {table.getHeaderGroups().map((headerGroup) => {
              return (
                <Styled.ColumnHeader key={headerGroup.id} style={{ display: 'flex' }}>
                  {headerGroup.headers.map((header) => {
                    const { column } = header

                    return (
                      <Styled.HeaderCell
                        className={clsx({ large: column.id === 'folderType' })}
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

                            <Styled.HeaderButtons>
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
                                  transform:
                                    (column.getIsSorted() as string) === 'asc'
                                      ? 'scaleY(-1)'
                                      : undefined,
                                }}
                                onClick={column.getToggleSortingHandler()}
                                selected={!!column.getIsSorted()}
                              />
                            </Styled.HeaderButtons>
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
                          </Styled.TableCellContent>
                        )}
                      </Styled.HeaderCell>
                    )
                  })}
                </Styled.ColumnHeader>
              )
            })}
          </Styled.TableHeader>
          <tbody
            style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
            onContextMenu={handleTableBodyContextMenu}
          >
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
                  <TableCellsMemo row={row} columnPinning={columnPinning} />
                </tr>
              )
            })}
          </tbody>
        </table>
      </Styled.TableContainer>
    </Styled.TableWrapper>
  )
}

export default FlexTableWithProviders
