// React and Styling imports
import { FC, useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'
import { Button } from '@ynput/ayon-react-components'
import * as Styled from './TableSettings.styled'
import {
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table'

// Context and Components imports
import {
  ColumnsConfig,
  TableGroupBy,
  useColumnSettingsContext,
} from '@shared/containers/ProjectTreeTable/context/ColumnSettingsContext'
import ColumnItem from './ColumnItem'
import SortableColumnItem from './SortableColumnItem'

// DND (Drag and Drop) imports
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  DragStartEvent,
  useSensor,
  useSensors,
  PointerSensor,
  DragOverlay,
  DragOverEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'

// Notification imports
import { toast } from 'react-toastify'
import { checkColumnVisibility } from '../../containers/ProjectTreeTable/utils'
import { SettingsPanelItem } from '../SettingsPanel/SettingsPanelItemTemplate'
import { SettingHighlightedId, useMenuContext } from '@shared/context'
import { MenuItemType } from '../Menu'
import { buildAddColumnsMenu } from './addColumnsMenu'
import { AddColumnMenu } from './AddColumnMenu'

const ADD_COLUMN_MENU_LIST_ID = 'add-column-menu-list'

interface ColumnsSettingsProps {
  columns: SettingsPanelItem[]
  highlighted?: SettingHighlightedId
  columnVisibility: VisibilityState
  updateColumnVisibility: (visibility: VisibilityState) => void
  columnPinning: ColumnPinningState
  updateColumnPinning: (pinning: ColumnPinningState) => void
  columnOrder: ColumnOrderState
  setColumnsConfig: (config: ColumnsConfig) => void
  columnSizing: ColumnSizingState
  groupBy?: TableGroupBy
  sorting: SortingState
  rowHeight?: number
  defaultColumnVisibility?: VisibilityState
  columnSummaries?: ColumnsConfig['columnSummaries']
  columnSummaryScopes?: ColumnsConfig['columnSummaryScopes']
  columnSummaryFormats?: ColumnsConfig['columnSummaryFormats']
  groupByConfig?: ColumnsConfig['groupByConfig']
  addColumnMenuItems?: MenuItemType[]
  // when set, the bottom button opens the menu already anchored to the panel header button
  addColumnMenuId?: string
}

export const ColumnsSettings: FC<ColumnsSettingsProps> = ({
  columns,
  highlighted,
  columnVisibility,
  updateColumnVisibility,
  columnPinning,
  updateColumnPinning,
  columnOrder,
  setColumnsConfig,
  columnSizing,
  groupBy,
  sorting,
  rowHeight,
  defaultColumnVisibility,
  columnSummaries,
  columnSummaryScopes,
  columnSummaryFormats,
  groupByConfig,
  addColumnMenuItems,
  addColumnMenuId,
}) => {
  // State for the currently dragged column
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isDraggingOverPinned, setIsDraggingOverPinned] = useState(false)
  const [isDraggingFromPinned, setIsDraggingFromPinned] = useState(false)
  // Add a new state to track if we're hovering over the visible section
  const [isHoveringVisibleSection, setIsHoveringVisibleSection] = useState(false)

  const { toggleMenuOpen } = useMenuContext()

  const containerRef = useRef<HTMLDivElement | null>(null)

  // an open sub-menu keeps the items it was opened with, so adding must read the latest state
  const latestRef = useRef({ columnVisibility, updateColumnVisibility })
  latestRef.current = { columnVisibility, updateColumnVisibility }

  // deep-links (Lists "go to attribute") point at a column that is usually hidden — show it first.
  // Only once per highlighted column, otherwise hiding it again would immediately bring it back.
  const shownHighlightRef = useRef<SettingHighlightedId>(null)
  useEffect(() => {
    if (!highlighted || shownHighlightRef.current === highlighted) return
    if (!columns.some((col) => col.value === highlighted)) return
    shownHighlightRef.current = highlighted
    const { columnVisibility, updateColumnVisibility } = latestRef.current
    if (checkColumnVisibility(columnVisibility, highlighted, defaultColumnVisibility)) return
    updateColumnVisibility({ ...columnVisibility, [highlighted]: true })
  }, [highlighted, columns, defaultColumnVisibility])

  // if highlighted is set, scroll to the highlighted column
  useEffect(() => {
    if (!containerRef.current || !highlighted) return
    containerRef.current
      .querySelector(`#column-settings-${highlighted}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [highlighted, columnVisibility])

  // Setup sensors for dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  )

  // Separate columns into visible, hidden, and pinned
  const { visibleColumns, hiddenColumns, pinnedColumns } = useMemo(() => {
    // First filter columns by visibility
    const visible = columns.filter((col) =>
      checkColumnVisibility(columnVisibility, col.value, defaultColumnVisibility),
    )
    const hidden = columns.filter(
      (col) => !checkColumnVisibility(columnVisibility, col.value, defaultColumnVisibility),
    )

    // Then separate out pinned columns from visible
    const pinned = visible.filter((col) => columnPinning.left?.includes(col.value))
    const unpinnedVisible = visible.filter((col) => !columnPinning.left?.includes(col.value))

    return {
      visibleColumns: unpinnedVisible,
      hiddenColumns: hidden,
      pinnedColumns: pinned,
    }
  }, [columns, columnVisibility, columnPinning, defaultColumnVisibility])

  // Sort columns based on columnOrder
  const sortedVisibleColumns = useMemo(() => {
    // Create a copy of visible columns
    const visibleCopy = [...visibleColumns]

    // If we have a column order, use it to sort
    if (columnOrder.length > 0) {
      visibleCopy.sort((a, b) => {
        const indexA = columnOrder.indexOf(a.value)
        const indexB = columnOrder.indexOf(b.value)

        // If column is not in order array, place at end
        if (indexA === -1) return 1
        if (indexB === -1) return -1

        return indexA - indexB
      })
    }

    return visibleCopy
  }, [visibleColumns, columnOrder])

  // Sort pinned columns based on columnOrder
  const sortedPinnedColumns = useMemo(() => {
    // Create a copy of pinned columns
    const pinnedCopy = [...pinnedColumns]

    // If we have a column order, use it to sort
    if (columnOrder.length > 0) {
      pinnedCopy.sort((a, b) => {
        const indexA = columnOrder.indexOf(a.value)
        const indexB = columnOrder.indexOf(b.value)

        // If column is not in order array, place at end
        if (indexA === -1) return 1
        if (indexB === -1) return -1

        return indexA - indexB
      })
    }

    return pinnedCopy
  }, [pinnedColumns, columnOrder])

  const sortedVisibleColumnsIds = useMemo(
    () => sortedVisibleColumns.map((col) => col.value),
    [sortedVisibleColumns],
  )

  const sortedPinnedColumnsIds = useMemo(
    () => sortedPinnedColumns.map((col) => col.value),
    [sortedPinnedColumns],
  )

  // fallback for consumers rendering outside ColumnSettingsContext (e.g. ProjectsPage)
  const fallbackAddColumnMenuItems = useMemo(
    () =>
      buildAddColumnsMenu({
        columns: hiddenColumns,
        onAdd: (columnId) => {
          const { columnVisibility, updateColumnVisibility } = latestRef.current
          updateColumnVisibility({ ...columnVisibility, [columnId]: true })
        },
      }),
    [hiddenColumns],
  )

  const addColumnItems = addColumnMenuItems ?? fallbackAddColumnMenuItems
  const menuId = addColumnMenuId ?? ADD_COLUMN_MENU_LIST_ID

  // Toggle column visibility
  const toggleVisibility = (columnId: string) => {
    const isVisible = checkColumnVisibility(columnVisibility, columnId, defaultColumnVisibility)
    const newState = { ...columnVisibility, [columnId]: !isVisible }
    updateColumnVisibility(newState)
  }

  // Toggle column pinning
  const togglePinning = (columnId: string) => {
    const newState = { ...columnPinning }
    const newVisibility = { ...columnVisibility }

    // If column is currently pinned, unpin it
    if (newState.left?.includes(columnId)) {
      newState.left = newState.left.filter((id) => id !== columnId)
    } else {
      // If column is currently unpinned, pin it
      newState.left = [...(newState.left || []), columnId]
      // If column is hidden, show it
      if (!checkColumnVisibility(columnVisibility, columnId, defaultColumnVisibility)) {
        newVisibility[columnId] = true
        updateColumnVisibility(newVisibility)
      }
    }
    updateColumnPinning(newState)
  }

  // When drag starts
  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id as string
    setActiveId(id)
    setIsDraggingFromPinned(columnPinning.left?.includes(id) || false)
  }

  // Track when dragging over different sections
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const isOverVisible = checkColumnVisibility(
        columnVisibility,
        over.id as string,
        defaultColumnVisibility,
      )
      const isOverPinned = columnPinning.left?.includes(over.id as string) || false

      setIsDraggingOverPinned(isOverVisible && isOverPinned)

      // Set if we're hovering over the visible (unpinned) section
      setIsHoveringVisibleSection(isOverVisible && !isOverPinned)
    } else {
      // Reset when not over any column
      setIsHoveringVisibleSection(false)
    }
  }

  // When drag ends, reset all states
  const handleDragEnd = (event: DragEndEvent) => {
    // Reset states
    setIsDraggingOverPinned(false)
    setIsDraggingFromPinned(false)
    setIsHoveringVisibleSection(false)

    const { active, over } = event

    if (over && active.id !== over.id) {
      // Find the dragged column and target column
      const activeColumn = [...visibleColumns, ...pinnedColumns].find(
        (col) => col.value === active.id,
      )
      const overColumn = [...visibleColumns, ...pinnedColumns].find((col) => col.value === over.id)

      if (activeColumn && overColumn) {
        const activeId = active.id as string
        const overId = over.id as string
        const isActiveVisible = checkColumnVisibility(
          columnVisibility,
          activeId,
          defaultColumnVisibility,
        )
        const isOverVisible = checkColumnVisibility(
          columnVisibility,
          overId,
          defaultColumnVisibility,
        )
        const isActivePinned = columnPinning.left?.includes(activeId) || false
        const isOverPinned = columnPinning.left?.includes(overId) || false

        // Create a new config object that we'll update and apply at the end
        const newConfig: ColumnsConfig = {
          columnVisibility: { ...columnVisibility },
          columnOrder: [...columnOrder],
          columnPinning: { ...columnPinning },
          columnSizing: { ...columnSizing },
          columnSummaries,
          columnSummaryScopes,
          columnSummaryFormats,
          groupBy,
          groupByConfig,
          sorting,
          rowHeight,
        }

        // If we're moving a column between visible columns (including pinned)
        if (isActiveVisible && isOverVisible) {
          let newPinningLeft = [...(newConfig.columnPinning.left || [])]

          // Handle pinning/unpinning based on target section
          if (isActivePinned !== isOverPinned) {
            if (isActivePinned && !isOverPinned) {
              // Moving from pinned to unpinned section
              newPinningLeft = newPinningLeft.filter((id) => id !== activeId)
            } else if (!isActivePinned && isOverPinned) {
              // Moving from unpinned to pinned section
              newPinningLeft = [...newPinningLeft, activeId]
            }
          }

          // Update order within the appropriate section
          const allVisibleIds = [...sortedPinnedColumnsIds, ...sortedVisibleColumnsIds]
          const oldIndex = allVisibleIds.indexOf(activeId)
          const newIndex = allVisibleIds.indexOf(overId)

          if (oldIndex === -1 || newIndex === -1) {
            console.error('Invalid column order state')
            toast.error('Invalid column order state')
            return
          }

          const newOrder = arrayMove(allVisibleIds, oldIndex, newIndex)

          // new pinning left should be ordered by the new order
          const newPinningLeftOrdered = newOrder.filter((id) => newPinningLeft.includes(id))

          // Update config object
          newConfig.columnOrder = newOrder
          newConfig.columnPinning = {
            ...newConfig.columnPinning,
            left: newPinningLeftOrdered,
          }

          // Apply all changes at once
          setColumnsConfig(newConfig)
        }
      }
    }

    setActiveId(null)
  }

  // Find the active column for the drag overlay
  const activeColumn = activeId
    ? [...visibleColumns, ...pinnedColumns].find((col) => col.value === activeId)
    : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <ColumnsContainer ref={containerRef}>
        {/* Pinned Columns Section */}
        {pinnedColumns.length > 0 && (
          <Section className={isDraggingOverPinned && !isDraggingFromPinned ? 'drop-target' : ''}>
            <SectionTitle>Pinned Columns</SectionTitle>
            <SortableContext
              items={sortedPinnedColumns.map((col) => col.value)}
              strategy={verticalListSortingStrategy}
            >
              <Styled.Menu>
                {sortedPinnedColumns.map((column) => (
                  <SortableColumnItem
                    key={column.value}
                    id={column.value}
                    column={column}
                    isPinned={true}
                    isHidden={false}
                    isDisabled={!!groupBy && column.value === 'name'} // Disable 'name' column if grouping is enabled
                    isHighlighted={highlighted === column.value}
                    onTogglePinning={togglePinning}
                    onToggleVisibility={toggleVisibility}
                  />
                ))}
              </Styled.Menu>
            </SortableContext>
          </Section>
        )}

        {/* Visible Columns Section */}
        <Section className={isDraggingFromPinned && isHoveringVisibleSection ? 'drop-target' : ''}>
          <SectionTitle>Visible Columns</SectionTitle>
          <SortableContext
            items={sortedVisibleColumns.map((col) => col.value)}
            strategy={verticalListSortingStrategy}
          >
            <Styled.Menu>
              {sortedVisibleColumns.map((column) => (
                <SortableColumnItem
                  key={column.value}
                  id={column.value}
                  column={column}
                  isPinned={false}
                  isHidden={false}
                  isHighlighted={highlighted === column.value}
                  isDisabled={!!groupBy && column.value === 'name'} // Disable 'name' column if grouping is enabled
                  onTogglePinning={togglePinning}
                  onToggleVisibility={toggleVisibility}
                />
              ))}
            </Styled.Menu>
          </SortableContext>
          <AddColumnButton
            variant="text"
            icon="add"
            id={addColumnMenuId ? undefined : menuId}
            disabled={!addColumnItems.length}
            onClick={() => toggleMenuOpen(menuId)}
          >
            Add column
          </AddColumnButton>
          {!addColumnMenuId && <AddColumnMenu menuId={menuId} menuItems={addColumnItems} />}
        </Section>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeColumn && (
            <ColumnItem
              column={activeColumn}
              isPinned={columnPinning.left?.includes(activeColumn.value) || false}
              isHidden={false}
              isHighlighted={highlighted === activeColumn.value}
              dragOverlay={true}
            />
          )}
        </DragOverlay>
      </ColumnsContainer>
    </DndContext>
  )
}

// Styled components
const ColumnsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-large);
`

const Section = styled.section`
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: background-color 0.2s ease;
  border-radius: 4px;

  &.drop-target {
    background-color: var(--md-sys-color-surface-container);
    box-shadow: 0 0 0 1px var(--md-sys-color-outline);
  }
`

const SectionTitle = styled.div`
  font-weight: 500;
  color: var(--md-sys-color-outline);
  padding: 4px 0;
`

const AddColumnButton = styled(Button)`
  justify-content: flex-start;
  margin-top: var(--base-gap-small);
`

export default ColumnsSettings

// Backward-compat wrapper that reads all data from ColumnSettingsContext
type ColumnsSettingsWithContextProps = Pick<
  ColumnsSettingsProps,
  'columns' | 'highlighted' | 'addColumnMenuItems' | 'addColumnMenuId'
>

export const ColumnsSettingsWithContext: FC<ColumnsSettingsWithContextProps> = (props) => {
  const {
    columnVisibility,
    defaultColumnVisibility,
    updateColumnVisibility,
    columnPinning,
    updateColumnPinning,
    columnOrder,
    setColumnsConfig,
    columnSizing,
    groupBy,
    groupByConfig,
    sorting,
    rowHeight,
    columnSummaries,
    columnSummaryScopes,
    columnSummaryFormats,
  } = useColumnSettingsContext()

  return (
    <ColumnsSettings
      {...props}
      columnVisibility={columnVisibility}
      defaultColumnVisibility={defaultColumnVisibility}
      updateColumnVisibility={updateColumnVisibility}
      columnPinning={columnPinning}
      updateColumnPinning={updateColumnPinning}
      columnOrder={columnOrder}
      setColumnsConfig={setColumnsConfig}
      columnSizing={columnSizing}
      groupBy={groupBy}
      groupByConfig={groupByConfig}
      sorting={sorting}
      rowHeight={rowHeight}
      columnSummaries={columnSummaries}
      columnSummaryScopes={columnSummaryScopes}
      columnSummaryFormats={columnSummaryFormats}
    />
  )
}
