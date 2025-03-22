import { useProjectTableContext } from '@containers/ProjectTreeTable/context/ProjectTableContext'
import { FC, useMemo, useState } from 'react'
import styled from 'styled-components'
import ColumnItem, { ColumnItemData } from './ColumnItem'

// DND imports
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  DragStartEvent,
  useSensor,
  useSensors,
  PointerSensor,
  DragOverlay,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import SortableColumnItem from './SortableColumnItem'

interface ColumnsSettingsProps {
  columns: ColumnItemData[]
}

const ColumnsSettings: FC<ColumnsSettingsProps> = ({ columns }) => {
  const {
    columnVisibility,
    setColumnVisibility,
    columnPinning,
    setColumnPinning,
    columnOrder,
    setColumnOrder,
  } = useProjectTableContext()

  // State for the currently dragged column
  const [activeId, setActiveId] = useState<string | null>(null)

  // Setup sensors for dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  )

  // Separate columns into visible and hidden
  const { visibleColumns, hiddenColumns, allColumnIds } = useMemo(() => {
    // First filter columns by visibility
    const visible = columns.filter((col) => columnVisibility[col.value] !== false)
    const hidden = columns.filter((col) => columnVisibility[col.value] === false)

    // Map all column IDs for order tracking
    const allIds = columns.map((col) => col.value)

    return {
      visibleColumns: visible,
      hiddenColumns: hidden,
      allColumnIds: allIds,
    }
  }, [columns, columnVisibility])

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
    setColumnVisibility(newState)
  }

  // Toggle column pinning
  const togglePinning = (columnId: string) => {
    const newState = { ...columnPinning }
    // If column is currently pinned, unpin it
    if (newState.left?.includes(columnId)) {
      newState.left = newState.left.filter((id) => id !== columnId)
    } else {
      // If column is currently unpinned, pin it
      newState.left = [...(newState.left || []), columnId]
    }
    setColumnPinning(newState)
  }

  // When drag starts
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  // When drag ends
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      // Find the dragged column and target column
      const activeColumn = [...visibleColumns, ...hiddenColumns].find(
        (col) => col.value === active.id,
      )
      const overColumn = [...visibleColumns, ...hiddenColumns].find((col) => col.value === over.id)

      if (activeColumn && overColumn) {
        // If we're moving a column between visible columns
        if (
          columnVisibility[active.id as string] !== false &&
          columnVisibility[over.id as string] !== false
        ) {
          // Update order
          const currentOrder = columnOrder.length > 0 ? [...columnOrder] : [...allColumnIds]
          const oldIndex = currentOrder.indexOf(active.id as string)
          const newIndex = currentOrder.indexOf(over.id as string)
          setColumnOrder(arrayMove(currentOrder, oldIndex, newIndex))
        }

        // If we're dragging from hidden to visible
        if (
          columnVisibility[active.id as string] === false &&
          columnVisibility[over.id as string] !== false
        ) {
          // Make the column visible
          const newVisibility = { ...columnVisibility }
          newVisibility[active.id as string] = true
          setColumnVisibility(newVisibility)

          // Update order to place it near the over column
          const currentOrder = columnOrder.length > 0 ? [...columnOrder] : [...allColumnIds]

          // Add the column to order if not already there
          if (!currentOrder.includes(active.id as string)) {
            const overIndex = currentOrder.indexOf(over.id as string)
            currentOrder.splice(overIndex, 0, active.id as string)
          }

          setColumnOrder(currentOrder)
        }
      }
    }

    setActiveId(null)
  }

  // Find the active column for the drag overlay
  const activeColumn = activeId
    ? [...visibleColumns, ...hiddenColumns].find((col) => col.value === activeId)
    : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <ColumnsContainer>
        <Section>
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
                  isPinned={columnPinning.left?.includes(column.value) || false}
                  isHidden={false}
                  onTogglePinning={togglePinning}
                  onToggleVisibility={toggleVisibility}
                />
              ))}
            </Menu>
          </SortableContext>
        </Section>

        {hiddenColumns.length > 0 && (
          <Section>
            <SectionTitle>Hidden Columns</SectionTitle>
            <SortableContext
              items={hiddenColumns.map((col) => col.value)}
              strategy={verticalListSortingStrategy}
            >
              <Menu>
                {hiddenColumns.map((column) => (
                  <SortableColumnItem
                    key={column.value}
                    id={column.value}
                    column={column}
                    isPinned={columnPinning.left?.includes(column.value) || false}
                    isHidden={true}
                    onTogglePinning={togglePinning}
                    onToggleVisibility={toggleVisibility}
                  />
                ))}
              </Menu>
            </SortableContext>
          </Section>
        )}

        {/* Drag Overlay */}
        <DragOverlay>
          {activeColumn && (
            <ColumnItem
              column={activeColumn}
              isPinned={columnPinning.left?.includes(activeColumn.value) || false}
              isHidden={columnVisibility[activeColumn.value] === false}
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
