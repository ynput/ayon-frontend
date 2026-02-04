import { useMemo, useRef, useEffect, memo, CSSProperties, useCallback, UIEventHandler } from 'react' // Added useCallback
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
  ExpandedState,
} from '@tanstack/react-table'

// Utility imports
import clsx from 'clsx'

// Type imports
import type { TableRow } from './types/table'

// Component imports
import buildTreeTableColumns, {
  DefaultColumns,
  isEntityExpandable,
  TreeTableExtraColumn,
} from './buildTreeTableColumns'
import * as Styled from './ProjectTreeTable.styled'
import { RowDragHandleCellContent, ColumnHeaderMenu } from './components'
import EmptyPlaceholder from '../../components/EmptyPlaceholder'
import HeaderActionButton from './components/HeaderActionButton'

// Context imports
import { useCellEditing } from './context/CellEditingContext'
import { ROW_SELECTION_COLUMN_ID, useSelectionCellsContext } from './context/SelectionCellsContext'
import { ClipboardProvider } from './context/ClipboardContext'
import { useSelectedRowsContext } from './context/SelectedRowsContext'
import { useColumnSettingsContext } from './context/ColumnSettingsContext'
import { useMenuContext } from '../../context/MenuContext'

// Hook imports
import useCustomColumnWidthVars from './hooks/useCustomColumnWidthVars'
import usePrefetchFolderTasks from './hooks/usePrefetchFolderTasks'
import useCellContextMenu, {
  HeaderLabel,
  ContextMenuItemConstructors,
} from './hooks/useCellContextMenu'
import useColumnVirtualization from './hooks/useColumnVirtualization'
import useKeyboardNavigation from './hooks/useKeyboardNavigation'
import useDynamicRowHeight from './hooks/useDynamicRowHeight'

// EntityPickerDialog import
import { EntityPickerDialog } from '../EntityPickerDialog/EntityPickerDialog'
// Move entity hook
import { useMoveEntities } from './hooks/useMoveEntities'
import { useProjectDataContext } from '@shared/containers'

// Utility function imports
import { getCellId, parseCellId } from './utils/cellUtils'
import { generateLoadingRows, generateDummyAttributes } from './utils/loadingUtils'
import { isEntityRestricted, isTargetReadOnly } from './utils/restrictedEntity'
import { createPortal } from 'react-dom'
import { Button, Icon } from '@ynput/ayon-react-components'
import { AttributeEnumItem, ProjectTableAttribute, BuiltInFieldOptions } from './types'
import { ToggleExpandAll, useProjectTableContext } from './context/ProjectTableContext'
import { getEntityViewierIds, getReadOnlyLists, getTableFieldOptions } from './utils'
import { EntityUpdate } from './hooks/useUpdateTableData'

// dnd-kit imports
import {
  DragOverlay,
  useDndContext,
  type UniqueIdentifier,
  // Removed: DndContext, KeyboardSensor, MouseSensor, TouchSensor, closestCenter, DragEndEvent, DragStartEvent, Active, Over, useSensor, useSensors
} from '@dnd-kit/core'
// import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { SortableContext, verticalListSortingStrategy, useSortable, horizontalListSortingStrategy, } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { useProjectContext } from '@shared/context'
import { EDIT_TRIGGER_CLASS } from './widgets/CellWidget'
import { toast } from 'react-toastify'
import { EntityMoveData } from '@shared/context/MoveEntityContext'
import { upperFirst } from 'lodash'
import { ColumnsConfig } from './types/columnConfig'

type CellUpdate = (
  entity: Omit<EntityUpdate, 'id'>,
  config?: { selection?: string[] },
) => Promise<void>

declare module '@tanstack/react-table' {
  interface TableMeta<TData extends RowData> {
    options?: BuiltInFieldOptions
    readOnly?: ProjectTreeTableProps['readOnly']
    projectName?: string
    updateEntities?: CellUpdate
    toggleExpandAll?: ToggleExpandAll
    selection?: string[]
    columnsConfig?: ColumnsConfig
  }
}

//These are the important styles to make sticky column pinning work!
//Apply styles like this using your CSS strategy of choice with this kind of logic to head cells, data cells, footer cells, etc.
//View the index.css file for more needed styles such as border-collapse: separate
const getCommonPinningStyles = (column: Column<TableRow, unknown>): CSSProperties => {
  const isPinned = column.getIsPinned()
  const offset =
    column.id !== ROW_SELECTION_COLUMN_ID && column.id !== DRAG_HANDLE_COLUMN_ID ? -30 : 0

  return {
    left: isPinned === 'left' ? `${column.getStart('left') + offset}px` : undefined, // Removed offset
    right: isPinned === 'right' ? `${column.getAfter('right')}px` : undefined,
    position: isPinned ? 'sticky' : 'relative',
    width: column.getSize(),
    zIndex: isPinned ? 100 : 0,
  }
}

const getColumnWidth = (rowId: string, columnId: string) => {
  return `calc(var(--col-${columnId}-size) * 1px)`
}
// test

export const DRAG_HANDLE_COLUMN_ID = 'drag-handle'

export interface ProjectTreeTableProps extends React.HTMLAttributes<HTMLDivElement> {
  scope: string
  sliceId: string
  onScrollBottom?: React.HTMLAttributes<HTMLDivElement>['onScroll']
  onOpenNew?: (type: 'folder' | 'task') => void
  readOnly?: (DefaultColumns | string)[]
  excludedColumns?: (DefaultColumns | string)[]
  excludedSorting?: (DefaultColumns | string)[]
  extraColumns?: TreeTableExtraColumn[]
  includeLinks?: boolean
  isLoading?: boolean
  isExpandable?: boolean // if true, show the expand/collapse icons
  clientSorting?: boolean
  sortableRows?: boolean
  onRowReorder?: (active: UniqueIdentifier, over: UniqueIdentifier | null) => void // Adjusted type for active/over if needed, or keep as Active, Over
  dndActiveId?: UniqueIdentifier | null // Added prop
  columnsConfig?: ColumnsConfig // Configure column behavior (display, styling, etc.)
  onScrollBottomGroupBy?: (groupValue: string) => void // Handle scroll to bottom for grouped data
  contextMenuItems?: ContextMenuItemConstructors // Additional context menu items to merge with defaults
  pt?: {
    container?: React.HTMLAttributes<HTMLDivElement>
    head?: Partial<TableHeadProps>
  }
}

export const ProjectTreeTable = ({
  scope,
  sliceId,
  onScroll,
  onScrollBottom, // when the user scrolls to the bottom of the table, this callback is called
  onOpenNew,
  readOnly,
  excludedColumns,
  excludedSorting,
  extraColumns,
  includeLinks,
  isLoading: isLoadingProp,
  isExpandable,
  clientSorting = false,
  sortableRows = false,
  onRowReorder,
  dndActiveId, // Destructure new prop
  columnsConfig,
  onScrollBottomGroupBy, // Destructure new prop for group-by load more
  contextMenuItems: propsContextMenuItems, // Additional context menu items from props
  pt,
  ...props
}: ProjectTreeTableProps) => {
  const {
    columnVisibility,
    columnPinning,
    columnOrder,
    columnSizing,
    setAllColumns,
    sorting,
    sortingOnChange,
    columnPinningOnChange,
    columnSizingOnChange,
    columnVisibilityOnChange,
    columnOrderOnChange,
    groupBy,
  } = useColumnSettingsContext()
  const isGrouping = !!groupBy
  const { productTypes, projectName, ...projectInfo } = useProjectContext()

  const {
    tableData,
    attribFields,
    entitiesMap,
    users,
    isLoading: isLoadingData,
    error,
    isInitialized,
    expanded,
    updateExpanded,
    toggleExpandAll,
    showHierarchy,
    fetchNextPage,
    scopes, // or entityTypes
    getEntityById,
    onResetView,
  } = useProjectTableContext()

  const { writableFields } = useProjectDataContext()

  const isLoading = isLoadingProp || isLoadingData

  const {
    statuses = [],
    folderTypes = [],
    taskTypes = [],
    tags = [],
    linkTypes = [],
  } = projectInfo || {}
  const options: BuiltInFieldOptions = useMemo(
    () =>
      getTableFieldOptions({
        users,
        statuses,
        folderTypes,
        taskTypes,
        productTypes,
        tags,
        scopes,
      }),
    [users, statuses, folderTypes, taskTypes, scopes, tags],
  )

  //The virtualizer needs to know the scrollable container element
  const tableContainerRef = useRef<HTMLDivElement>(null)
  // reference of how many rows are currently rendered in the table
  const tableRowsCountRef = useRef(0)

  // Selection context
  const { registerGrid } = useSelectionCellsContext()

  // generate loading attrib and rows
  const { loadingAttrib, loadingRows } = useMemo(() => {
    // count the number of children in tbody
    const tableRowsCount = tableContainerRef.current?.querySelectorAll('tbody tr').length || 0
    const loadingAttrib = generateDummyAttributes()
    const loadingRows = generateLoadingRows(
      showHierarchy && tableData.length > 0
        ? Math.min(tableRowsCount, 50)
        : groupBy
        ? Math.max(tableRowsCountRef.current, 50)
        : 50,
    )

    return { loadingAttrib, loadingRows }
  }, [])

  const showLoadingRows = !isInitialized || isLoading

  // Format readonly columns and attributes
  const { readOnlyColumns, readOnlyAttribs } = useMemo(
    () => getReadOnlyLists(attribFields, writableFields, readOnly),
    [attribFields, writableFields, readOnly],
  )

  const { selectedCells } = useSelectionCellsContext()
  const { updateEntities } = useCellEditing()

  const handleCellUpdate: CellUpdate = useCallback(
    async (entity, config) => {
      const { selection = [] } = config || {}
      const entitiesToUpdate: EntityUpdate[] = []
      if (!selection?.length) {
        entitiesToUpdate.push({ ...entity, id: entity.rowId })
      } else {
        // if includeSelection is true, update all the selected cells with the same columnId
        const { field, value, isAttrib } = entity
        for (const cellId of selectedCells) {
          const { colId, rowId } = parseCellId(cellId) || {}

          // ignore row selection column
          if (colId === ROW_SELECTION_COLUMN_ID) continue

          const entity = getEntityById(rowId || '')
          if (!entity) {
            console.warn(`Entity with ID ${rowId} not found for cell update.`)
            continue
          }

          if ((!colId?.includes('attrib_') || colId?.replace('attrib_', '') === field) && rowId) {
            entitiesToUpdate.push({
              field: field,
              rowId: rowId,
              id: entity.entityId,
              value: value,
              isAttrib: isAttrib,
              type: entity.entityType,
            })
          }
        }
      }

      if (!entitiesToUpdate.length) {
        console.warn('No entities to update, skipping updateEntities call.')
        toast.warn('No entities to update.')
        return
      }

      await updateEntities(entitiesToUpdate, true)
    },
    [updateEntities, getEntityById, selectedCells],
  )

  const columnAttribs = useMemo(
    () => (isInitialized ? attribFields : loadingAttrib),
    [attribFields, loadingAttrib, isInitialized],
  )

  const getNameLabelHeader = () => {
    if (scopes.includes('version')) return 'Product / Version'
    return scopes.map((s) => upperFirst(s)).join(' / ')
  }

  const columns = useMemo(() => {
    const baseColumns = buildTreeTableColumns({
      scopes,
      attribs: columnAttribs,
      links: linkTypes,
      includeLinks,
      showHierarchy,
      options,
      extraColumns,
      excluded: excludedColumns,
      excludedSorting,
      groupBy,
      nameLabel: getNameLabelHeader(),
    })

    if (sortableRows) {
      return [
        {
          id: DRAG_HANDLE_COLUMN_ID,
          header: () => null,
          cell: () => null, // Content rendered by TableBodyRow
          size: 24,
          minSize: 24,
          maxSize: 24,
          enableResizing: false,
          enableSorting: false,
          enableHiding: false,
          enablePinning: false, // Programmatically pinned
        },
        ...baseColumns,
      ]
    }
    return baseColumns
  }, [
    scopes,
    columnAttribs,
    showHierarchy,
    isExpandable,
    options,
    linkTypes,
    includeLinks,
    extraColumns,
    excludedColumns,
    excludedSorting,
    sortableRows,
  ])

  // Keep ColumnSettingsProvider's allColumns ref up to date
  useEffect(() => {
    const ids = columns.map((c) => c.id!).filter(Boolean)
    setAllColumns(ids)
  }, [columns, setAllColumns])

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
    getRowCanExpand: () => !!isExpandable || showHierarchy || isGrouping,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    filterFromLeafRows: true,
    // EXPANDABLE
    onExpandedChange: updateExpanded,
    // SORTING
    enableSorting: true,
    getSortedRowModel: getSortedRowModel(),
    sortDescFirst: false,
    manualSorting: !clientSorting,
    onSortingChange: sortingOnChange,
    columnResizeMode: 'onChange',
    onColumnPinningChange: columnPinningOnChange,
    onColumnSizingChange: columnSizingOnChange,
    onColumnVisibilityChange: columnVisibilityOnChange,
    onColumnOrderChange: columnOrderOnChange,
    // @ts-ignore
    filterFns,
    state: {
      expanded,
      sorting,
      columnPinning: (() => {
        const leftPins: string[] = []
        if (sortableRows) {
          leftPins.push(DRAG_HANDLE_COLUMN_ID)
        }
        leftPins.push(ROW_SELECTION_COLUMN_ID)

        // Add other unique pins from context, ensuring they are not the programmatic ones
        const contextLeftPins = (columnPinning.left || []).filter(
          (id) => id !== DRAG_HANDLE_COLUMN_ID && id !== ROW_SELECTION_COLUMN_ID,
        )
        leftPins.push(...contextLeftPins)
        // Remove duplicates just in case, though filter should handle it
        const uniqueLeftPins = [...new Set(leftPins)]

        return {
          left: uniqueLeftPins,
          right: columnPinning.right,
        }
      })(),
      columnSizing,
      columnVisibility,
      columnOrder,
    },
    meta: {
      projectName,
      options,
      readOnly: readOnlyColumns,
      updateEntities: handleCellUpdate,
      toggleExpandAll,
      loadMoreRows: fetchNextPage,
      selection: Array.from(selectedCells),
      columnsConfig,
    },
  })

  // TODO: when there is data (like in error) then we have infinite rendering

  const { rows } = table.getRowModel()

  // update the tableRowsCountRef with the current number of rows
  useEffect(() => {
    tableRowsCountRef.current = rows.length
  }, [rows.length])

  // Register grid structure with selection context when rows or columns change
  useEffect(() => {
    if (!rows.length) return
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
    columnSizing,
    columnOrder,
  })

  const columnSizeVars = useCustomColumnWidthVars(table, columnSizing)

  // Calculate dynamic row height based on user setting from Customize panel
  const { getRowHeight, defaultRowHeight } = useDynamicRowHeight()

  const attribByField = useMemo(() => {
    return attribFields.reduce((acc: Record<string, AttributeEnumItem[]>, attrib) => {
      if (attrib.data?.enum?.length) {
        acc[attrib.name] = attrib.data?.enum
      }
      return acc
    }, {})
  }, [attribFields])

  const rowOrderIds = useMemo(() => tableData.map((row) => row.id), [tableData])
  // Get column IDs for drag-and-drop (exclude non-draggable columns)
  const columnOrderIds = useMemo(() => {
    return visibleColumns
      .map((col) => col.id)
      .filter((id) => id !== DRAG_HANDLE_COLUMN_ID && id !== ROW_SELECTION_COLUMN_ID)
  }, [visibleColumns])

  const draggedRowData = useMemo(() => {
    if (!dndActiveId || !sortableRows) return null // Use dndActiveId
    return tableData.find((r) => r.id === dndActiveId) // Use dndActiveId
  }, [dndActiveId, tableData, sortableRows])

  const combinedScrollHandler: UIEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      // Call the original onScroll if provided
      onScroll?.(e)

      if (onScrollBottom) {
        const containerRefElement = e.currentTarget
        if (containerRefElement && !showHierarchy && !groupBy) {
          const { scrollHeight, scrollTop, clientHeight } = containerRefElement
          //once the user has scrolled within 500px of the bottom of the table, fetch more data if we can
          if (scrollHeight - scrollTop - clientHeight < 500 && !isLoading) {
            onScrollBottom(e)
          }
        }
      }

      // Handle scroll-to-bottom for grouped data
      if (onScrollBottomGroupBy && groupBy) {
        const containerRefElement = e.currentTarget
        // look for a load more button
        const loadMoreButton = containerRefElement?.querySelector('.load-more')
        // get load more button id
        const loadMoreButtonId = loadMoreButton?.getAttribute('id')
        const groupValue = loadMoreButtonId?.split('-')[2] // assuming the id is in the format 'load-more-groupValue'
        if (groupValue) {
          onScrollBottomGroupBy(groupValue)
        }
      }
    },
    [onScroll, onScrollBottom, onScrollBottomGroupBy, showHierarchy, groupBy, isLoading],
  )

  // Get move entity functions for the dialog
  const {
    isEntityPickerOpen,
    handleMoveSubmit,
    closeMoveDialog,
    movingEntities,
    handleMoveToRoot,
    getDisabledFolderIds,
    getDisabledMessage,
  } = useMoveEntities({
    projectName,
  })

  const handleMoveSubmitWithExpand = (selection: string[]) => {
    handleMoveSubmit(selection)
    const folderIdToExpand = selection[0]

    updateExpanded((prevExpanded: ExpandedState) => {
      if (typeof prevExpanded === 'boolean') {
        if (prevExpanded) {
          return prevExpanded
        }
        return { [folderIdToExpand]: true }
      }

      if (prevExpanded[folderIdToExpand]) {
        return prevExpanded
      }

      return {
        ...prevExpanded,
        [folderIdToExpand]: true,
      }
    })
  }

  const tableUiContent = (
    <ClipboardProvider
      entitiesMap={entitiesMap}
      columnEnums={{ ...options, ...attribByField }}
      columnReadOnly={readOnlyAttribs}
      visibleColumns={visibleColumns}
    >
      <Styled.TableWrapper {...props}>
        <Styled.TableContainer
          ref={tableContainerRef}
          style={{ height: '100%', padding: 0 }}
          onScroll={combinedScrollHandler}
          {...pt?.container}
          className={clsx(
            'table-container',
            {
              resizing: table.getState().columnSizingInfo.isResizingColumn,
            },
            pt?.container?.className,
          )}
        >
          <table
            style={{
              display: 'grid',
              borderCollapse: 'collapse',
              userSelect: 'none',
              ...columnSizeVars,
              width: table.getTotalSize(),
              cursor: table.getState().columnSizingInfo.isResizingColumn ? 'col-resize' : undefined,
            }}
          >
            <TableHead
              columnVirtualizer={columnVirtualizer}
              table={table}
              virtualPaddingLeft={virtualPaddingLeft}
              virtualPaddingRight={virtualPaddingRight}
              isLoading={isLoading}
              readOnlyColumns={readOnlyColumns}
              sortableRows={sortableRows}
              columnOrderIds={columnOrderIds}
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
              rowOrderIds={rowOrderIds}
              sortableRows={sortableRows}
              error={error}
              isLoading={isLoading}
              isGrouping={isGrouping}
              getRowHeight={getRowHeight}
              defaultRowHeight={defaultRowHeight}
              onResetView={onResetView}
              contextMenuItems={propsContextMenuItems}
            />
          </table>
        </Styled.TableContainer>
      </Styled.TableWrapper>
      {/* Render EntityPickerDialog alongside table content */}
      {isEntityPickerOpen &&
        projectName &&
        movingEntities?.entities &&
        movingEntities.entities.length > 0 && (
          <EntityPickerDialog
            projectName={projectName}
            entityType="folder"
            onSubmit={handleMoveSubmitWithExpand}
            onClose={closeMoveDialog}
            showMoveToRoot={movingEntities.entities.every(
              (entity: EntityMoveData) => entity.entityType === 'folder',
            )}
            onMoveToRoot={handleMoveToRoot}
            disabledIds={getDisabledFolderIds()}
            getDisabledMessage={getDisabledMessage}
          />
        )}
    </ClipboardProvider>
  )

  // Render DragOverlay if sortableRows and dndActiveId is present
  const dragOverlayPortal =
    sortableRows &&
    dndActiveId &&
    createPortal(
      <DragOverlay dropAnimation={null}>
        {draggedRowData
          ? (() => {
              const overlayRowInstance = table.getRowModel().rows.find((r) => r.id === dndActiveId)
              if (!overlayRowInstance) return null

              const tableWidth = table.getTotalSize()

              return (
                <table
                  style={{
                    width: tableWidth,
                    borderCollapse: 'collapse',
                    backgroundColor: 'var(--md-sys-color-surface-container-high)',
                    boxShadow: '0 0 10px rgba(0,0,0,0.2)',
                    ...columnSizeVars,
                  }}
                >
                  <tbody>
                    <Styled.TR style={{ display: 'flex', userSelect: 'none' }}>
                      {virtualPaddingLeft ? (
                        <td style={{ display: 'flex', width: virtualPaddingLeft }} />
                      ) : null}
                      {columnVirtualizer.getVirtualItems().map((vc) => {
                        const cell = overlayRowInstance.getVisibleCells()[vc.index]
                        if (!cell) return null

                        const cellStyleBase: CSSProperties = {
                          ...getCommonPinningStyles(cell.column),
                          width: getColumnWidth(overlayRowInstance.id, cell.column.id),
                          display: 'flex',
                          alignItems: 'center',
                          height: defaultRowHeight,
                        }

                        if (cell.column.id === DRAG_HANDLE_COLUMN_ID) {
                          return (
                            <Styled.TD
                              key={`overlay-drag-${cell.id}`}
                              style={{ ...cellStyleBase, justifyContent: 'center' }}
                              className={clsx(cell.column.id)}
                            >
                              <Icon icon="drag_handle" /> {/* Static icon */}
                            </Styled.TD>
                          )
                        }
                        return (
                          <TD
                            cell={cell}
                            cellId={`overlay-${getCellId(overlayRowInstance.id, cell.column.id)}`}
                            rowId={overlayRowInstance.id}
                            key={`overlay-cell-${cell.id}`}
                            showHierarchy={showHierarchy}
                          />
                        )
                      })}
                      {virtualPaddingRight ? (
                        <td style={{ display: 'flex', width: virtualPaddingRight }} />
                      ) : null}
                    </Styled.TR>
                  </tbody>
                </table>
              )
            })()
          : null}
      </DragOverlay>,
      document.body,
    )

  if (sortableRows) {
    return (
      <>
        {tableUiContent}
        {dragOverlayPortal}
        <ColumnDragOverlay table={table} />
      </>
    )
  } else {
    return (
      <>
        {tableUiContent}
        <ColumnDragOverlay table={table} />
      </>
    )
  }
}

/**
 * Isolated component for column drag overlay.
 * This prevents the entire table from re-rendering on every drag frame.
 */
interface ColumnDragOverlayProps {
  table: Table<TableRow>
}

const ColumnDragOverlay = ({ table }: ColumnDragOverlayProps) => {
  const { active } = useDndContext()

  // Only process if dragging a column
  const isColumnDrag = active?.data?.current?.type === 'column'
  const activeColumnId = isColumnDrag ? (active?.id as string) : null

  const draggedColumnHeader = useMemo(() => {
    if (!activeColumnId) return null
    return table.getHeaderGroups()[0]?.headers.find((h) => h.id === activeColumnId) || null
  }, [activeColumnId, table])

  if (!activeColumnId || !draggedColumnHeader) return null

  return createPortal(
    <DragOverlay dropAnimation={null}>
      <Styled.HeaderCell
        style={{
          width: draggedColumnHeader.column.getSize(),
          backgroundColor: 'var(--md-sys-color-surface-container-high)',
          boxShadow: '0 0 10px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          minHeight: 34,
        }}
      >
        <Styled.TableCellContent className="bold header">
          {flexRender(
            draggedColumnHeader.column.columnDef.header,
            draggedColumnHeader.getContext(),
          )}
        </Styled.TableCellContent>
      </Styled.HeaderCell>
    </DragOverlay>,
    document.body,
  )
}

interface TableHeadProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  columnVirtualizer: Virtualizer<HTMLDivElement, HTMLTableCellElement>
  table: Table<TableRow>
  virtualPaddingLeft: number | undefined
  virtualPaddingRight: number | undefined
  isLoading: boolean
  readOnlyColumns?: string[]
  sortableRows?: boolean
  columnOrderIds: string[]
}

const TableHead = ({
  columnVirtualizer,
  table,
  virtualPaddingLeft,
  virtualPaddingRight,
  isLoading,
  readOnlyColumns,
  sortableRows,
  columnOrderIds,
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
          sortableRows={sortableRows}
          columnOrderIds={columnOrderIds}
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
  sortableRows?: boolean
  columnOrderIds: string[]
}

const TableHeadRow = ({
  columnVirtualizer,
  headerGroup,
  virtualPaddingLeft,
  virtualPaddingRight,
  isLoading,
  readOnlyColumns,
  sortableRows,
  columnOrderIds,
}: TableHeadRowProps) => {
  const virtualColumns = columnVirtualizer.getVirtualItems()
  return (
    <Styled.ColumnHeader key={headerGroup.id} style={{ display: 'flex' }}>
      {virtualPaddingLeft ? (
        //fake empty column to the left for virtualization scroll padding
        <th style={{ display: 'flex', width: virtualPaddingLeft }} />
      ) : null}
      <SortableContext items={columnOrderIds} strategy={horizontalListSortingStrategy}>
        {virtualColumns.map((virtualColumn) => {
          const header = headerGroup.headers[virtualColumn.index]
          // Exclude certain columns from being draggable
          const isDraggable =
            header.id !== DRAG_HANDLE_COLUMN_ID && header.id !== ROW_SELECTION_COLUMN_ID

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
              sortableRows={sortableRows}
              isDraggable={isDraggable}
            />
          )
        })}
      </SortableContext>
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
  sortableRows?: boolean
  isDraggable?: boolean
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
  sortableRows,
  isDraggable = true,
}: TableHeadCellProps) => {
  const { column } = header
  const sorting = column.getIsSorted()
  const menuId = `column-header-menu-${column.id}`
  const { menuOpen } = useMenuContext()
  const isOpen = menuOpen === menuId

  // useSortable for column drag-and-drop
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: { type: 'column' },
    disabled: !isDraggable,
  })

  const dragStyle: CSSProperties = {
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    transition,
    visibility: isDragging ? 'hidden' : 'visible',
    zIndex: isDragging ? 200 : undefined,
  }

  // Stop drag from triggering when clicking action buttons
  const preventDragFromActions = {
    onPointerDown: (e: React.PointerEvent) => e.stopPropagation(),
    onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
  }

  return (
    <Styled.HeaderCell
      ref={setNodeRef}
      className={clsx(header.id, 'shimmer-dark', {
        loading: isLoading,
        'last-pinned-left': column.getIsPinned() === 'left' && column.getIsLastColumn('left'),
        resizing: column.getIsResizing(),
        dragging: isDragging,
        draggable: isDraggable,
      })}
      key={header.id}
      style={{
        ...getCommonPinningStyles(column),
        width: getColumnWidth('', column.id),
        ...dragStyle,
      }}
    >
      {header.isPlaceholder ? null : (
        <Styled.TableCellContent className={clsx('bold', 'header')}  {...(isDraggable ? { ...attributes, ...listeners } : {})}>
          {flexRender(column.columnDef.header, header.getContext())}
          {isReadOnly && (
            <Icon icon="lock" data-tooltip={'You only have permission to read this column.'} />
          )}

          <Styled.HeaderButtons className="actions" $isOpen={isOpen} {...preventDragFromActions}>
            {/* Column drag handle */}

            {(canHide || canPin || canSort) && (
              <ColumnHeaderMenu
                className="header-menu"
                header={header}
                canHide={canHide}
                canPin={canPin}
                canSort={canSort}
                isResizing={column.getIsResizing()}
                menuId={menuId}
                isOpen={isOpen}
              />
            )}

            {/* COLUMN SORTING */}
            {canSort && (
              <HeaderActionButton
                icon="sort"
                className={clsx('sort-button', { visible: sorting })}
                style={{
                  transform: sorting === 'asc' ? 'rotate(180deg) scaleX(-1)' : 'none',
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
                onMouseDown: (e: React.MouseEvent) => {
                  e.stopPropagation()
                  header.getResizeHandler()(e)
                },
                onTouchStart: header.getResizeHandler(),
                onPointerDown: (e: React.PointerEvent) => e.stopPropagation(),
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
  rowOrderIds: UniqueIdentifier[]
  sortableRows: boolean
  error?: string
  isLoading: boolean
  isGrouping: boolean
  getRowHeight: (row: TableRow) => number
  defaultRowHeight: number
  onResetView?: () => void
  contextMenuItems?: ContextMenuItemConstructors
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
  rowOrderIds,
  sortableRows,
  error,
  isLoading,
  isGrouping,
  getRowHeight,
  defaultRowHeight,
  onResetView,
  contextMenuItems,
}: TableBodyProps) => {
  const headerLabels = useMemo(() => {
    const allColumns = table.getAllColumns()
    const headers = allColumns
      .map((col) => {
        const headerId = col.id
        const header = col.columnDef.header
        if (typeof header === 'string' || typeof header === 'number') {
          return { label: header, id: headerId }
        }
        return null
      })
      .filter(Boolean)

    return headers as HeaderLabel[]
  }, [table.getAllColumns()])

  const cellContextMenuHook = useCellContextMenu({
    attribs,
    onOpenNew,
    headerLabels,
    contextMenuItems,
  })

  const handleTableBodyContextMenu = cellContextMenuHook.handleTableBodyContextMenu

  const { handlePreFetchTasks } = usePrefetchFolderTasks()

  const { rows } = table.getRowModel()

  const rowVirtualizer = useVirtualizer<HTMLDivElement, HTMLTableRowElement>({
    count: rows.length,
    estimateSize: (index) => {
      // Calculate dynamic row height based on specific row data
      const row = rows[index]
      return row ? getRowHeight(row.original) : defaultRowHeight
    },
    getScrollElement: () => tableContainerRef.current,
    //measure dynamic row height, except in firefox because it measures table border height incorrectly
    measureElement:
      typeof window !== 'undefined' && navigator.userAgent.indexOf('Firefox') === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
    overscan: 5,
  })

  const virtualRows = rowVirtualizer.getVirtualItems()

  // Memoize the measureElement callback
  const measureRowElement = useCallback(
    (node: HTMLTableRowElement | null) => {
      if (node) {
        rowVirtualizer.measureElement(node)
      }
    },
    [rowVirtualizer],
  )

  useKeyboardNavigation()

  const tbodyContent = (
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
      {virtualRows.map((virtualRow, i) => {
        const row = rows[virtualRow.index] as Row<TableRow>
        // Add a check for row existence to prevent potential errors if data is out of sync
        if (!row) {
          console.warn('Virtualized row data not found for index:', virtualRow.index)
          return null
        }
        return (
          <TableBodyRow
            key={row.id + i.toString()} // dnd-kit needs this key to be stable and match the id in useSortable
            row={row}
            showHierarchy={showHierarchy}
            visibleCells={row.getVisibleCells()}
            virtualColumns={columnVirtualizer.getVirtualItems()}
            paddingLeft={virtualPaddingLeft}
            paddingRight={virtualPaddingRight}
            rowRef={measureRowElement}
            dataIndex={virtualRow.index}
            offsetTop={virtualRow.start}
            sortableRows={sortableRows}
            isGrouping={isGrouping}
            rowHeight={getRowHeight(row.original)}
          />
        )
      })}
    </tbody>
  )

  if (error) {
    return (
      tableContainerRef.current &&
      createPortal(
        <Styled.AnimatedEmptyPlaceholder>
          <EmptyPlaceholder message="No items found" error={error}>
            {onResetView && (
              <Button
                variant="filled"
                label="Reset working view"
                icon="restart_alt"
                onClick={onResetView}
              />
            )}
          </EmptyPlaceholder>
        </Styled.AnimatedEmptyPlaceholder>,
        tableContainerRef.current,
      )
    )
  }

  if (!rows.length && !isLoading) {
    return (
      tableContainerRef.current &&
      createPortal(
        <Styled.AnimatedEmptyPlaceholder>
          <EmptyPlaceholder message="No items found">
            {onResetView && (
              <Button
                variant="filled"
                label="Reset working view"
                icon="restart_alt"
                onClick={onResetView}
              />
            )}
          </EmptyPlaceholder>
        </Styled.AnimatedEmptyPlaceholder>,
        tableContainerRef.current,
      )
    )
  }

  if (sortableRows) {
    return (
      <SortableContext items={rowOrderIds} strategy={verticalListSortingStrategy}>
        {tbodyContent}
      </SortableContext>
    )
  } else {
    return tbodyContent
  }
}

interface TableBodyRowProps {
  row: Row<TableRow>
  showHierarchy: boolean
  visibleCells: Cell<TableRow, unknown>[]
  virtualColumns: VirtualItem[]
  paddingLeft: number | undefined
  paddingRight: number | undefined
  rowRef: (node: HTMLTableRowElement | null) => void
  dataIndex: number
  offsetTop: number
  sortableRows: boolean
  isGrouping: boolean
  rowHeight: number
}

const TableBodyRow = ({
  row,
  showHierarchy,
  visibleCells,
  virtualColumns,
  paddingLeft,
  paddingRight,
  rowRef,
  dataIndex,
  offsetTop,
  sortableRows,
  isGrouping = false,
  rowHeight,
}: TableBodyRowProps) => {
  const sortable = sortableRows ? useSortable({ id: row.id }) : null

  const combinedRef = useCallback(
    (node: HTMLTableRowElement | null) => {
      if (sortable) {
        sortable.setNodeRef(node)
      }
      // rowRef for virtualizer measurement
      // only measure if not actively being transformed by dnd-kit
      if (!(sortable && sortable.isDragging)) {
        rowRef(node)
      }
    },
    [sortable, rowRef],
  )

  // Attempt to combine dnd-kit transform with virtualizer's offsetTop
  const style: CSSProperties = {
    position: 'absolute', // Use absolute positioning for virtualized items
    top: offsetTop, // Position based on virtualizer's calculation (virtualRow.start)
    left: 0, // Span full width of the relative parent (tbody)
    right: 0, // Span full width
    height: rowHeight, // Use dynamic row height
    zIndex: sortable && sortable.isDragging ? 0 : 1, // Ensure dragged item is above others
    display: 'flex', // Styled.TR is display:flex
    transform:
      sortable && sortable.transform ? CSS.Transform.toString(sortable.transform) : undefined, // Apply dnd-kit's transform for drag effect
    transition: sortable && sortable.transition ? sortable.transition : undefined,
    visibility: sortable && sortable.isDragging ? 'hidden' : 'visible', // Hide the row being dragged
  }

  return (
    <Styled.TR
      ref={combinedRef}
      data-index={dataIndex} //needed for dynamic row height measurement
      style={style}
      className={clsx({ 'group-row': row.original.group })}
    >
      {paddingLeft ? (
        //fake empty column to the left for virtualization scroll padding
        <td style={{ display: 'flex', width: paddingLeft }} />
      ) : null}
      {virtualColumns.map((vc, i) => {
        const cell = visibleCells[vc.index]
        if (!cell) return null // Should not happen in normal circumstances

        const cellId = getCellId(row.id, cell.column.id)

        if (cell.column.id === DRAG_HANDLE_COLUMN_ID) {
          return (
            <Styled.TD
              key={cell.id + i.toString()}
              style={{
                ...getCommonPinningStyles(cell.column),
                width: getColumnWidth(row.id, cell.column.id),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: rowHeight,
                pointerEvents: 'all',
                cursor: 'grab',
              }}
              className={clsx(cell.column.id, {
                'last-pinned-left':
                  cell.column.getIsPinned() === 'left' && cell.column.getIsLastColumn('left'),
              })}
              onMouseDown={(e) => e.stopPropagation()} // Prevent selection interference
              onMouseOver={(e) => e.stopPropagation()}
              onDoubleClick={(e) => e.stopPropagation()}
              onContextMenu={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
            >
              <RowDragHandleCellContent
                attributes={sortable?.attributes}
                listeners={sortable?.listeners}
              />
            </Styled.TD>
          )
        }
        return (
          <TD
            cell={cell}
            cellId={cellId}
            rowId={row.id}
            key={cell.id + i.toString()}
            showHierarchy={showHierarchy}
            sortableRows={sortableRows}
            rowHeight={rowHeight}
          />
        )
      })}

      {paddingRight ? (
        //fake empty column to the right for virtualization scroll padding
        <td style={{ display: 'flex', width: paddingRight }} />
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
  sortableRows?: boolean
  rowHeight?: number
}

const TD = ({
  cell,
  rowId,
  cellId,
  className,
  showHierarchy,
  sortableRows,
  rowHeight,
  ...props
}: TableCellProps) => {
  const { getEntityById, onOpenPlayer } = useProjectTableContext()

  const {
    isCellSelected,
    isCellFocused,
    startSelection,
    extendSelection,
    endSelection,
    selectCell,
    focusCell,
    getCellBorderClasses,
    clearSelection,
    selectedCells,
  } = useSelectionCellsContext()

  const { isRowSelected } = useSelectedRowsContext()

  const { isEditing, setEditingCellId, editingCellId } = useCellEditing()

  const borderClasses = getCellBorderClasses(cellId)

  const isPinned = cell.column.getIsPinned()
  const isLastLeftPinnedColumn = isPinned === 'left' && cell.column.getIsLastColumn('left')
  const isRowSelectionColumn = cell.column.id === ROW_SELECTION_COLUMN_ID
  const isGroup = cell.row.original.entityType === 'group'
  const isMultipleSelected = selectedCells.size > 1

  return (
    <Styled.TD
      {...props}
      tabIndex={0}
      $isLastPinned={isLastLeftPinnedColumn} // is this column the last pinned column? Custom styling for borders.
      className={clsx(
        cell.column.id,
        {
          selected: isCellSelected(cellId),
          focused: isCellFocused(cellId),
          editing: isEditing(cellId),
          'last-pinned-left': isLastLeftPinnedColumn,
          'selected-row': isRowSelected(rowId),
          expandable:
            !!cell.row.originalSubRows && isEntityExpandable(cell.row.original.entityType),
          'multiple-selected': isMultipleSelected,
        },
        className,
        ...borderClasses,
      )}
      style={{
        ...getCommonPinningStyles(cell.column),
        width: getColumnWidth(cell.row.id, cell.column.id),
        height: rowHeight,
      }}
      onMouseDown={(e) => {
        // Only process left clicks (button 0), ignore right clicks
        if (e.button !== 0) return

        const target = e.target as HTMLElement

        // check we are not clicking on expander
        if (target.closest('.expander')) return

        // check we are not clicking in a dropdown
        if (target.closest('.options')) return

        // only name column can be selected for group rows
        if (isGroup && cell.column.id !== 'name') return clearSelection()

        // check if this is a restricted entity - prevent editing
        const isRestricted = isEntityRestricted(cell.row.original.entityType)

        // if clicking on an edit trigger, start editing
        if (target.closest('.' + EDIT_TRIGGER_CLASS) && !isRestricted) {
          // Select the cell first if not already selected
          if (!isCellSelected(cellId)) {
            selectCell(cellId, false, false)
            focusCell(cellId)
          }
          setEditingCellId(cellId)
          return
        }

        // If there's an active edit on a different cell, blur it first to save changes
        if (editingCellId && editingCellId !== cellId) {
          // Find the currently editing input and blur it
          const editingInput = document.querySelector(
            `#${editingCellId} input, #${editingCellId} [role="textbox"]`,
          ) as HTMLElement
          if (editingInput) {
            editingInput.blur()
            // Wait a tick for the blur event to process and save
            setTimeout(() => {
              proceedWithSelection()
            }, 0)
            return
          }
        }

        proceedWithSelection()

        function proceedWithSelection() {
          const additive = e.metaKey || e.ctrlKey || isRowSelectionColumn
          if (e.shiftKey) {
            // Shift+click extends selection from anchor cell
            selectCell(cellId, additive, true) // true for range selection
          } else {
            startSelection(cellId, additive)
          }

          // Prevent default browser behavior to ensure focus stays on the cell
          e.preventDefault()
        }
      }}
      onMouseOver={(e) => {
        if (e.buttons === 1) {
          // check not selecting am edit trigger
          const target = e.target as HTMLElement
          if (target.closest('.' + EDIT_TRIGGER_CLASS)) return

          // Left button is pressed during mouse move - drag selection
          // Note: extendSelection is always called to allow drag to continue through cells
          // Restricted cells will be filtered out later
          extendSelection(cellId, isRowSelectionColumn)
        }
      }}
      onMouseUp={() => {
        endSelection(cellId)
      }}
      onDoubleClick={(e) => {
        const isReadOnly = isTargetReadOnly(e)
        if (isReadOnly) return

        // check if this is a restricted entity - prevent opening details/viewer
        const isRestricted = isEntityRestricted(cell.row.original.entityType)

        // do nothing for restricted entities
        if (isRestricted) return

        // do nothing for groups
        if (isGroup) return

        // row selection on name column double click
        // making sure it's not the expander that was clicked
        if (cell.column.id === 'name' && !(e.target as HTMLElement).closest('.expander')) {
          // select the row by selecting the row-selection cell
          const rowSelectionCellId = getCellId(cell.row.id, ROW_SELECTION_COLUMN_ID)
          const additive = e.metaKey || e.ctrlKey

          // Select both the row-selection cell and the name cell
          if (!isCellSelected(rowSelectionCellId)) {
            selectCell(rowSelectionCellId, additive, false)
          }
          selectCell(cellId, true, false) // additive=true to keep row-selection
        }
        // open the viewer on thumbnail double click
        else if (cell.column.id === 'thumbnail') {
          if (onOpenPlayer) {
            const entity = getEntityById(cell.row.original.entityId || cell.row.id)
            if (entity) {
              const targetIds = getEntityViewierIds(entity)
              onOpenPlayer(targetIds, { quickView: true })
            }
          }
        }
        // Double click on editable cell triggers edit mode
        else {
          setEditingCellId(cellId)
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault()
        // if the cell is not selected, select it and deselect all others
        if (!isCellSelected(cellId)) {
          selectCell(cellId, false, false)
        }
      }}
      onKeyDown={() => {
        // keyboard events are handled in useKeyboardNavigation hook
      }}
    >
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </Styled.TD>
  )
}
