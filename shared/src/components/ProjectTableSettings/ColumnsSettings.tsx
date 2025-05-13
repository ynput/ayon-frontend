// React and Styling imports
import { FC, useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'

// Context and Components imports
import {
  ColumnsConfig,
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
import { SettingsPanelItem } from '../SettingsPanel/SettingsPanelItemTemplate'
import { SettingHighlightedId } from '@shared/context'

interface ColumnsSettingsProps {
  columns: SettingsPanelItem[]
  highlighted?: SettingHighlightedId
}

const ColumnsSettings: FC<ColumnsSettingsProps> = ({ columns, highlighted }) => {
  const {
    columnVisibility,
    updateColumnVisibility,
    columnPinning,
    updateColumnPinning,
    columnOrder,
    setColumnsConfig,
    columnSizing,
  } = useColumnSettingsContext()

  // State for the currently dragged column
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isHiddenOverVisible, setIsHiddenOverVisible] = useState(false)
  const [isDraggingOverPinned, setIsDraggingOverPinned] = useState(false)
  const [isDraggingFromPinned, setIsDraggingFromPinned] = useState(false)
  // Add a new state to track if we're hovering over the visible section
  const [isHoveringVisibleSection, setIsHoveringVisibleSection] = useState(false)
  // Add state to track if dragging over the hidden section
  const [isDraggingOverHidden, setIsDraggingOverHidden] = useState(false)

  // Setup sensors for dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  )

  const menuRef = useRef<HTMLUListElement | null>(null)

  // if highlighted is set, scroll to the highlighted column
  useEffect(() => {
    if (menuRef.current && highlighted) {
      const highlightedElement = menuRef.current.querySelector(`#column-settings-${highlighted}`)
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      }
    }
  }, [highlighted])

  // Separate columns into visible, hidden, and pinned
  const { visibleColumns, hiddenColumns, pinnedColumns } = useMemo(() => {
    // First filter columns by visibility
    const visible = columns.filter((col) => columnVisibility[col.value] !== false)
    const hidden = columns.filter((col) => columnVisibility[col.value] === false)

    // Then separate out pinned columns from visible
    const pinned = visible.filter((col) => columnPinning.left?.includes(col.value))
    const unpinnedVisible = visible.filter((col) => !columnPinning.left?.includes(col.value))

    return {
      visibleColumns: unpinnedVisible,
      hiddenColumns: hidden,
      pinnedColumns: pinned,
    }
  }, [columns, columnVisibility, columnPinning])

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

  // Toggle column visibility
  const toggleVisibility = (columnId: string) => {
    const newState = { ...columnVisibility }
    // If column is currently visible, hide it
    if (newState[columnId] !== false) {
      newState[columnId] = false
    } else {
      // If column is currently hidden, show it
      newState[columnId] = true
    }
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
      if (newVisibility[columnId] === false) {
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
      // Check if we're dragging a hidden column over a visible column
      const isActiveHidden = columnVisibility[active.id as string] === false
      const isOverVisible = columnVisibility[over.id as string] !== false
      const isOverPinned = columnPinning.left?.includes(over.id as string) || false
      const isOverHidden = columnVisibility[over.id as string] === false

      setIsHiddenOverVisible(isActiveHidden && isOverVisible && !isOverPinned)
      setIsDraggingOverPinned(isOverVisible && isOverPinned)
      setIsDraggingOverHidden(isOverHidden)

      // Set if we're hovering over the visible (unpinned) section
      setIsHoveringVisibleSection(isOverVisible && !isOverPinned)
    } else {
      // Reset when not over any column
      setIsHoveringVisibleSection(false)
      setIsDraggingOverHidden(false)
    }
  }

  // When drag ends, reset all states
  const handleDragEnd = (event: DragEndEvent) => {
    // Reset states
    setIsHiddenOverVisible(false)
    setIsDraggingOverPinned(false)
    setIsDraggingFromPinned(false)
    setIsHoveringVisibleSection(false)
    setIsDraggingOverHidden(false)

    const { active, over } = event

    if (over && active.id !== over.id) {
      // Find the dragged column and target column
      const activeColumn = [...visibleColumns, ...hiddenColumns, ...pinnedColumns].find(
        (col) => col.value === active.id,
      )
      const overColumn = [...visibleColumns, ...hiddenColumns, ...pinnedColumns].find(
        (col) => col.value === over.id,
      )

      if (activeColumn && overColumn) {
        const activeId = active.id as string
        const overId = over.id as string
        const isActiveVisible = columnVisibility[activeId] !== false
        const isOverVisible = columnVisibility[overId] !== false
        const isActivePinned = columnPinning.left?.includes(activeId) || false
        const isOverPinned = columnPinning.left?.includes(overId) || false
        const isOverHidden = columnVisibility[overId] === false

        // Create a new config object that we'll update and apply at the end
        const newConfig: ColumnsConfig = {
          columnVisibility: { ...columnVisibility },
          columnOrder: [...columnOrder],
          columnPinning: { ...columnPinning },
          columnSizing: { ...columnSizing },
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

        // If we're dragging from hidden to visible
        else if (!isActiveVisible && isOverVisible) {
          // Make the column visible
          newConfig.columnVisibility[activeId] = true

          // If dropping into pinned section, also pin the column
          if (isOverPinned) {
            const newPinningLeft = [...(newConfig.columnPinning.left || []), activeId]
            newConfig.columnPinning.left = newPinningLeft
          }

          // Update order to place it near the over column
          const allVisibleIds = [...sortedPinnedColumnsIds, ...sortedVisibleColumnsIds]

          // Add the column to order if not already there
          if (!allVisibleIds.includes(activeId)) {
            const overIndex = allVisibleIds.indexOf(overId)
            allVisibleIds.splice(overIndex, 0, activeId)
          }

          newConfig.columnOrder = allVisibleIds

          // Apply all changes at once
          setColumnsConfig(newConfig)
        }

        // If we're dragging from visible to hidden
        else if (isActiveVisible && isOverHidden) {
          // Make the active column hidden
          newConfig.columnVisibility[activeId] = false

          // If the column was pinned, remove it from pinned
          if (isActivePinned) {
            const newPinningLeft = (newConfig.columnPinning.left || []).filter(
              (id) => id !== activeId,
            )
            newConfig.columnPinning.left = newPinningLeft
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
    ? [...visibleColumns, ...hiddenColumns, ...pinnedColumns].find((col) => col.value === activeId)
    : null

  console.log(highlighted)
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <ColumnsContainer>
        {/* Pinned Columns Section */}
        {pinnedColumns.length > 0 && (
          <Section className={isDraggingOverPinned && !isDraggingFromPinned ? 'drop-target' : ''}>
            <SectionTitle>Pinned Columns</SectionTitle>
            <SortableContext
              items={sortedPinnedColumns.map((col) => col.value)}
              strategy={verticalListSortingStrategy}
            >
              <Menu>
                {sortedPinnedColumns.map((column) => (
                  <SortableColumnItem
                    key={column.value}
                    id={column.value}
                    column={column}
                    isPinned={true}
                    isHidden={false}
                    isHighlighted={highlighted === column.value}
                    onTogglePinning={togglePinning}
                    onToggleVisibility={toggleVisibility}
                  />
                ))}
              </Menu>
            </SortableContext>
          </Section>
        )}

        {/* Visible Columns Section */}
        <Section
          className={
            isHiddenOverVisible || (isDraggingFromPinned && isHoveringVisibleSection)
              ? 'drop-target'
              : ''
          }
        >
          <SectionTitle>Visible Columns</SectionTitle>
          <SortableContext
            items={sortedVisibleColumns.map((col) => col.value)}
            strategy={verticalListSortingStrategy}
          >
            <Menu>
              {sortedVisibleColumns.map((column) => (
                <SortableColumnItem
                  key={column.value}
                  id={column.value}
                  column={column}
                  isPinned={false}
                  isHidden={false}
                  isHighlighted={highlighted === column.value}
                  onTogglePinning={togglePinning}
                  onToggleVisibility={toggleVisibility}
                />
              ))}
            </Menu>
          </SortableContext>
        </Section>

        {/* Hidden Columns Section */}
        {hiddenColumns.length > 0 && (
          <Section className={isDraggingOverHidden ? 'drop-target' : ''}>
            <SectionTitle>Hidden Columns</SectionTitle>
            <Menu ref={menuRef}>
              {hiddenColumns.map((column) => (
                <SortableColumnItem
                  key={column.value}
                  id={column.value}
                  column={column}
                  isPinned={columnPinning.left?.includes(column.value) || false}
                  isHidden={true}
                  isHighlighted={highlighted === column.value}
                  onTogglePinning={togglePinning}
                  onToggleVisibility={toggleVisibility}
                />
              ))}
            </Menu>
          </Section>
        )}

        {/* Drag Overlay */}
        <DragOverlay>
          {activeColumn && (
            <ColumnItem
              column={activeColumn}
              isPinned={columnPinning.left?.includes(activeColumn.value) || false}
              isHidden={columnVisibility[activeColumn.value] === false}
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

const Menu = styled.ul`
  display: flex;
  flex-direction: column;
  list-style-type: none;
  margin: 0;
  padding: 0;
`

export default ColumnsSettings
