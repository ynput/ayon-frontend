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
import { SettingHighlightedId, useMenuContext } from '@shared/context'
import type { MenuItemType } from '../Menu'
import { AddColumnItem, buildAddColumnsMenu, getAddColumnSection } from './addColumnsMenu'
import { AddColumnMenu } from './AddColumnMenu'
import { TableSearch } from '../TableSearch'
import {
  SettingsPanelItemTemplate,
  SettingsPanelItemTemplateProps,
} from '../SettingsPanel/SettingsPanelItemTemplate'
import { InputSwitch } from '@ynput/ayon-react-components'

const ADD_COLUMN_MENU_LIST_ID = 'add-column-menu-list'
const NO_SCOPES: string[] = []

export interface SettingSwitchProps
  extends Omit<SettingsPanelItemTemplateProps, 'onChange' | 'item'> {
  icon?: string
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

export const SettingSwitch: FC<SettingSwitchProps> = ({
  icon,
  label,
  checked,
  onChange,
  disabled,
  ...props
}) => (
  <SettingsPanelItemTemplate
    item={{ value: label, label, icon }}
    isDisabled={disabled}
    style={{ paddingRight: 8 }}
    disableHover
    endContent={
      <InputSwitch
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.currentTarget.checked)}
      />
    }
    {...props}
  />
)

interface ColumnsSettingsProps {
  columns: AddColumnItem[]
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
  scopes?: string[]
  // when a string (including ''), the panel switches to a flat searchable list of all columns
  search?: string | null
  onSearchChange?: (search: string | null) => void
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
  scopes = NO_SCOPES,
  search,
  onSearchChange,
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

  // show a deep-linked hidden column once; re-running would undo the user hiding it again
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

  // Separate columns into visible and pinned
  const { visibleColumns, pinnedColumns } = useMemo(() => {
    // First filter columns by visibility
    const visible = columns.filter((col) =>
      checkColumnVisibility(columnVisibility, col.value, defaultColumnVisibility),
    )

    // Then separate out pinned columns from visible
    const pinned = visible.filter((col) => columnPinning.left?.includes(col.value))
    const unpinnedVisible = visible.filter((col) => !columnPinning.left?.includes(col.value))

    return {
      visibleColumns: unpinnedVisible,
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

  // search results show the add-column menu path so nested columns are identifiable
  const searchResults = useMemo(() => {
    if (typeof search !== 'string') return []
    const terms = search.toLowerCase().split(/\s+/).filter(Boolean)
    return columns
      .map((col) => ({ ...col, path: getAddColumnSection(col, scopes)?.label }))
      .filter((col) => {
        const searchable = [col.path, col.label].filter(Boolean).join(' / ').toLowerCase()
        return terms.every((term) => searchable.includes(term))
      })
      // default column order, but grouped (sectioned) columns sink to the bottom
      .toSorted((a, b) => Number(!!a.path) - Number(!!b.path))
  }, [columns, search, scopes])

  // fallback for consumers rendering outside ColumnSettingsContext (e.g. ProjectsPage)
  const fallbackAddColumnMenuItems = useMemo(
    () =>
      buildAddColumnsMenu({
        columns,
        onToggle: (columnId) => {
          const { columnVisibility, updateColumnVisibility } = latestRef.current
          const isVisible = checkColumnVisibility(
            columnVisibility,
            columnId,
            defaultColumnVisibility,
          )
          updateColumnVisibility({ ...columnVisibility, [columnId]: !isVisible })
        },
        isColumnVisible: (columnId) =>
          checkColumnVisibility(columnVisibility, columnId, defaultColumnVisibility),
        scopes,
      }),
    [columns, columnVisibility, defaultColumnVisibility, scopes],
  )

  const addColumnItems = addColumnMenuItems ?? fallbackAddColumnMenuItems

  // the search bar takes the button's place so the list below it never shifts
  const addColumnRow =
    typeof search === 'string' ? (
      <SearchRow
        value={search}
        onChange={(value) => onSearchChange?.(value)}
        onClose={() => onSearchChange?.(null)}
      />
    ) : (
      <AddColumnListButton
        variant="text"
        icon="add"
        id={ADD_COLUMN_MENU_LIST_ID}
        disabled={!addColumnItems.length}
        onClick={() => toggleMenuOpen(ADD_COLUMN_MENU_LIST_ID)}
      >
        Add column
      </AddColumnListButton>
    )

  // Toggle column visibility
  const toggleVisibility = (columnId: string) => {
    const isVisible = checkColumnVisibility(columnVisibility, columnId, defaultColumnVisibility)
    const newState = { ...columnVisibility, [columnId]: !isVisible }
    updateColumnVisibility(newState)
  }

  const buildColumnsConfig = (overrides: Partial<ColumnsConfig>): ColumnsConfig => ({
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
    ...overrides,
  })

  // Toggle column pinning
  const togglePinning = (columnId: string) => {
    const newState = { ...columnPinning }

    // If column is currently pinned, unpin it
    if (newState.left?.includes(columnId)) {
      newState.left = newState.left.filter((id) => id !== columnId)
      updateColumnPinning(newState)
      return
    }

    newState.left = [...(newState.left || []), columnId]

    if (checkColumnVisibility(columnVisibility, columnId, defaultColumnVisibility)) {
      updateColumnPinning(newState)
      return
    }

    // showing and pinning as two updates would clobber each other, they both persist the raw config
    setColumnsConfig(
      buildColumnsConfig({
        columnPinning: newState,
        columnVisibility: { ...columnVisibility, [columnId]: true },
      }),
    )
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
        const newConfig = buildColumnsConfig({})

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

  if (typeof search === 'string') {
    return (
      <ColumnsContainer ref={containerRef}>
        {addColumnRow}
        <AddColumnMenu menuId={ADD_COLUMN_MENU_LIST_ID} menuItems={addColumnItems} />
        <Section>
          <SectionTitle>All Columns</SectionTitle>
          <Styled.Menu>
            {searchResults.map((column) => (
              <ColumnItem
                key={column.value}
                id={`column-settings-${column.value}`}
                column={column}
                isPinned={columnPinning.left?.includes(column.value) || false}
                isHidden={
                  !checkColumnVisibility(columnVisibility, column.value, defaultColumnVisibility)
                }
                isHighlighted={highlighted === column.value}
                isDisabled={!!groupBy && column.value === 'name'}
                hideDragHandle
                onTogglePinning={togglePinning}
                onToggleVisibility={toggleVisibility}
              />
            ))}
          </Styled.Menu>
        </Section>
      </ColumnsContainer>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <ColumnsContainer ref={containerRef}>
        {addColumnRow}
        <AddColumnMenu menuId={ADD_COLUMN_MENU_LIST_ID} menuItems={addColumnItems} />

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

const AddColumnListButton = styled(Button)`
  justify-content: flex-start;
`

const SearchRow = styled(TableSearch)`
  padding: 0;

  input {
    height: 32px;
  }
`

export default ColumnsSettings

// Backward-compat wrapper that reads all data from ColumnSettingsContext
type ColumnsSettingsWithContextProps = Pick<
  ColumnsSettingsProps,
  'columns' | 'highlighted' | 'addColumnMenuItems' | 'scopes' | 'search' | 'onSearchChange'
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
