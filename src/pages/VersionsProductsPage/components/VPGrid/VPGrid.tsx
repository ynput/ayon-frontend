import GridLayout from '@components/GridLayout'
import { useVersionsDataContext } from '../../context/VPDataContext'
import { useVersionsSelectionContext } from '../../context/VPSelectionContext'
import { useVPViewsContext } from '../../context/VPViewsContext'
import { buildVPGrid } from '../../util'
import { ROW_SELECTION_COLUMN_ID, useSelectionCellsContext } from '@shared/containers'
import { EntityCard } from '@ynput/ayon-react-components'
import { FC, useMemo, useCallback, useRef, useEffect } from 'react'
import { getCellId } from '@shared/containers/ProjectTreeTable/utils/cellUtils'
import { useGridKeyboardNavigation } from '../../hooks/useGridKeyboardNavigation'
import { useVPGridContextMenu } from '../../hooks'
import { VPGridGroupHeader } from './VPGridGroupHeader'
import { VPGridCard } from './VPGridCard'
import { useVPFocusContext } from '../../context/VPFocusContext'
import clsx from 'clsx'
import styled from 'styled-components'
import { EmptyPlaceholder } from '@shared/components'
import { VPContextMenuItems } from '../../hooks/useVPContextMenu'
import { useProjectContext } from '@shared/context'

const GridContainer = styled.div`
  width: 100%;
  background-color: var(--md-sys-color-surface-container-low);
  padding: 0 var(--padding-m);
  border-radius: var(--border-radius-m);
  max-height: 100%;
  height: 100%;
  overflow: auto;
  outline: none;

  & > div {
    margin: 8px 0;
  }
`

const GRID_COLUMN_ID = 'name'
const UNGROUPED_VALUE = '__UNGROUPED__'

interface VPGridProps {
  contextMenuItems: VPContextMenuItems
}

const VPGrid: FC<VPGridProps> = ({ contextMenuItems }) => {
  const { productTypes, projectName, ...projectInfo } = useProjectContext()
  const { productsMap, versionsMap, isLoading, fetchNextPage, groups, expanded, updateExpanded } =
    useVersionsDataContext()
  const { showProducts, gridHeight, groupBy, showEmptyGroups } = useVPViewsContext()
  const { selectedCells, setSelectedCells, setFocusedCellId, registerGrid } =
    useSelectionCellsContext()
  const { showVersionsTable } = useVersionsSelectionContext()
  const { focusVersionsTable, gridContainerRef } = useVPFocusContext()

  // context menu hook
  const { handleGridContextMenu } = useVPGridContextMenu(contextMenuItems)

  // Track the last clicked item for shift-click range selection
  const lastClickedIndexRef = useRef<number | null>(null)

  // Check if a group is expanded (default is expanded if not in the map, unless it's empty)
  const isGroupExpanded = useCallback(
    (groupValue: string, isEmpty: boolean = false) => {
      const groupId = `_GROUP_${groupValue}`
      const expandedState = (expanded as any)[groupId]

      // If explicitly set in the expanded object, use that value
      if (typeof expandedState === 'boolean') {
        return expandedState
      }

      // Default: empty groups are collapsed, non-empty groups are expanded
      return !isEmpty
    },
    [expanded],
  )

  const gridData = useMemo(
    () =>
      buildVPGrid({
        productsMap,
        versionsMap,
        showProducts: showProducts,
        projectName,
        productTypes,
      }),
    [productsMap, versionsMap, showProducts, projectName],
  )

  // Build grouped data structure
  const groupedData = useMemo(() => {
    // Grouping only works for versions, not products
    if (!groupBy || showProducts) return { '': gridData }

    const grouped: Record<string, typeof gridData> = {}

    // Initialize groups
    for (const group of groups) {
      const groupValue = group.value?.toString()
      if (groupValue) {
        grouped[groupValue] = []
      }
    }

    // Add ungrouped placeholder
    grouped[UNGROUPED_VALUE] = []

    // Assign versions to groups based on their metadata
    for (const entity of gridData) {
      if (entity.groups && entity.groups?.length > 0) {
        // Version has group metadata - add to all matching groups
        let addedToGroup = false
        for (const versionGroup of entity.groups) {
          const groupValue = versionGroup.value?.toString()
          if (groupValue && grouped.hasOwnProperty(groupValue)) {
            grouped[groupValue].push(entity)
            addedToGroup = true
          }
        }
        // If not added to any group, add to ungrouped
        if (!addedToGroup) {
          grouped[UNGROUPED_VALUE].push(entity)
        }
      } else {
        // No group metadata, add to ungrouped
        grouped[UNGROUPED_VALUE].push(entity)
      }
    }

    return grouped
  }, [gridData, groupBy, groups, showProducts])

  // Create a flat list of visible entities for keyboard navigation
  // This respects group expansion state
  const visibleGridData = useMemo(() => {
    if (!groupBy || !groups.length || showProducts) return gridData

    const visible: typeof gridData = []

    for (const [groupValue, groupEntities] of Object.entries(groupedData)) {
      // Skip empty ungrouped category
      if (groupValue === UNGROUPED_VALUE && groupEntities.length === 0) continue
      // Skip empty groups if showEmptyGroups is false
      if (groupEntities.length === 0 && !showEmptyGroups) continue

      // Only add entities if the group is expanded
      const isEmpty = groupEntities.length === 0
      if (isGroupExpanded(groupValue, isEmpty)) {
        visible.push(...groupEntities)
      }
    }

    return visible
  }, [gridData, groupBy, groups, showProducts, groupedData, showEmptyGroups, expanded])

  // Register grid entities so SelectedRowsProvider recognizes them
  useEffect(() => {
    const rowIds = visibleGridData.map((entity) => entity.id)
    registerGrid(rowIds, [GRID_COLUMN_ID, ROW_SELECTION_COLUMN_ID])
  }, [visibleGridData, registerGrid])

  // Handle Enter key press - same behavior as clicking the title
  const handleEnterPress = useCallback(
    (entityId: string) => {
      const nameCellId = getCellId(entityId, GRID_COLUMN_ID)
      const rowCellId = getCellId(entityId, ROW_SELECTION_COLUMN_ID)

      const newSelection = new Set<string>([nameCellId, rowCellId])
      setSelectedCells(newSelection)
      setFocusedCellId(nameCellId)
    },
    [setSelectedCells, setFocusedCellId],
  )

  // Handle Tab key press - move focus to versions table if visible
  const handleTabPress = useCallback(() => {
    if (showVersionsTable) {
      focusVersionsTable()
    }
  }, [showVersionsTable, focusVersionsTable])

  // Initialize keyboard navigation early to get reset function
  const { resetPositionTracking } = useGridKeyboardNavigation({
    gridData: visibleGridData,
    selectedCells,
    setSelectedCells,
    setFocusedCellId,
    gridContainerRef,
    onEnterPress: handleEnterPress,
    onTabPress: handleTabPress,
    gridColumnId: GRID_COLUMN_ID,
    rowSelectionColumnId: ROW_SELECTION_COLUMN_ID,
  })

  // Handle card click with support for single, shift, and cmd/ctrl selection
  const handleCardClick = useCallback(
    (e: React.MouseEvent, entityId: string, index: number, columnId: string) => {
      // Use columnId column to match table behavior
      const cellId = getCellId(entityId, columnId)

      // Check if we have any row selections
      const hasRowSelection = Array.from(selectedCells).some((id) =>
        id.includes(ROW_SELECTION_COLUMN_ID),
      )

      if (e.shiftKey && lastClickedIndexRef.current !== null) {
        // Shift+click: select range from last clicked to current
        const start = Math.min(lastClickedIndexRef.current, index)
        const end = Math.max(lastClickedIndexRef.current, index)
        const newSelection = new Set<string>()

        for (let i = start; i <= end; i++) {
          const id = visibleGridData[i]?.id
          if (id) {
            newSelection.add(getCellId(id, columnId))
            // If we have row selections, also add the corresponding name/row selection cells
            if (hasRowSelection || columnId === ROW_SELECTION_COLUMN_ID) {
              newSelection.add(getCellId(id, GRID_COLUMN_ID))
              newSelection.add(getCellId(id, ROW_SELECTION_COLUMN_ID))
            }
          }
        }

        setSelectedCells(newSelection)
        setFocusedCellId(cellId)
      } else if (e.metaKey || e.ctrlKey) {
        // Cmd/Ctrl+click: toggle this item in selection
        setSelectedCells((prev) => {
          const newSelection = new Set(prev)
          const nameCellId = getCellId(entityId, GRID_COLUMN_ID)
          const rowCellId = getCellId(entityId, ROW_SELECTION_COLUMN_ID)

          if (newSelection.has(cellId)) {
            newSelection.delete(cellId)
            // If we have row selections, also remove the corresponding cells
            if (hasRowSelection) {
              newSelection.delete(nameCellId)
              newSelection.delete(rowCellId)
            }
          } else {
            newSelection.add(cellId)
            // If we have row selections, also add the corresponding name/row selection cells
            if (hasRowSelection || columnId === ROW_SELECTION_COLUMN_ID) {
              newSelection.add(nameCellId)
              newSelection.add(rowCellId)
            }
          }
          return newSelection
        })
        setFocusedCellId(cellId)
        lastClickedIndexRef.current = index
      } else {
        // Normal click: select only this item
        const newSelection = new Set([cellId])

        // If we have row selections, also add the corresponding name/row selection cells
        if (hasRowSelection || columnId === ROW_SELECTION_COLUMN_ID) {
          newSelection.add(getCellId(entityId, GRID_COLUMN_ID))
          newSelection.add(getCellId(entityId, ROW_SELECTION_COLUMN_ID))
        }

        setSelectedCells(newSelection)
        setFocusedCellId(cellId)
        lastClickedIndexRef.current = index
      }

      // Focus the grid container to enable keyboard navigation
      gridContainerRef.current?.focus()

      // Reset keyboard navigation tracking since we're using mouse
      resetPositionTracking()
    },
    [
      visibleGridData,
      setSelectedCells,
      setFocusedCellId,
      selectedCells,
      gridContainerRef,
      resetPositionTracking,
    ],
  )

  // handle double click which selected the name and row selection cell
  const handleDoubleClick = useCallback(
    (_e: React.MouseEvent, entityId: string) => {
      // select both name and row selection cells
      const nameCellId = getCellId(entityId, GRID_COLUMN_ID)
      const rowCellId = getCellId(entityId, ROW_SELECTION_COLUMN_ID)

      const newSelection = new Set<string>([nameCellId, rowCellId])
      setSelectedCells(newSelection)
      setFocusedCellId(nameCellId)

      // Focus the grid container to enable keyboard navigation
      gridContainerRef.current?.focus()

      // Reset keyboard navigation tracking since we're using mouse
      resetPositionTracking()
    },
    [setFocusedCellId, setSelectedCells, gridContainerRef, resetPositionTracking],
  )

  const isEntitySelected = useCallback(
    (entityId: string, entityType: string): boolean => {
      const cellExists = (id: string) =>
        Array.from(selectedCells).some((cellId) => cellId.includes(id))

      if (entityType === 'version') {
        return cellExists(entityId)
      }

      if (entityType === 'product') {
        const product = productsMap.get(entityId)
        if (!product) return false

        return cellExists(product.id) || product.versions.some((version) => cellExists(version.id))
      }

      return false
    },
    [selectedCells, productsMap],
  )

  // Handle scroll to load more items when near bottom
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const containerRefElement = e.currentTarget
      if (containerRefElement && !isLoading) {
        const { scrollHeight, scrollTop, clientHeight } = containerRefElement
        // Once the user has scrolled within 500px of the bottom, fetch more data
        if (scrollHeight - scrollTop - clientHeight < 500) {
          fetchNextPage()
        }
      }
    },
    [isLoading, fetchNextPage],
  )

  // Handle group toggle
  const handleGroupToggle = useCallback(
    (groupValue: string) => {
      const groupId = `_GROUP_${groupValue}`
      const oldExpanded = expanded as Record<string, boolean>
      const newExpanded = {
        ...oldExpanded,
        [groupId]: typeof oldExpanded[groupId] === 'boolean' ? !oldExpanded[groupId] : true,
      }
      updateExpanded(newExpanded)
    },
    [updateExpanded, expanded],
  )

  // return a pages worth of loading skeletons
  if (isLoading) {
    return (
      <GridContainer>
        <GridLayout ref={gridContainerRef} ratio={1.777777} minWidth={190} onScroll={handleScroll}>
          {Array.from({ length: 20 }).map((_, index) => (
            <EntityCard
              key={index}
              style={{
                minWidth: 'unset',
              }}
              isLoading
            />
          ))}
        </GridLayout>
      </GridContainer>
    )
  }

  if (groupBy && showProducts) {
    return (
      <GridContainer>
        <EmptyPlaceholder message="Grouping is only available when viewing versions">
          Please disable "Show Products" to use grouping.
        </EmptyPlaceholder>
      </GridContainer>
    )
  }

  if (groupBy && !groups.length) {
    return (
      <GridContainer>
        <EmptyPlaceholder message="No groups available for the selected grouping criteria." />
      </GridContainer>
    )
  }

  if (!gridData.length && !groupBy) {
    return (
      <GridContainer>
        <EmptyPlaceholder message="No versions or products found." />
      </GridContainer>
    )
  }

  // Render with grouping
  if (groupBy && !showProducts) {
    return (
      <GridContainer ref={gridContainerRef} onScroll={handleScroll} data-grid-container="true">
        {Object.entries(groupedData).map(([groupValue, groupEntities]) => {
          // Find the group metadata
          const group =
            groupValue === UNGROUPED_VALUE
              ? { value: UNGROUPED_VALUE, label: 'Ungrouped', count: groupEntities.length }
              : groups.find((g) => g.value?.toString() === groupValue)

          if (!group) return null

          // Skip empty groups based on showEmptyGroups setting
          if (group.count === 0) {
            // Always skip empty ungrouped category
            if (groupValue === UNGROUPED_VALUE) return null
            // Skip empty groups if showEmptyGroups is false
            if (!showEmptyGroups) return null
          }

          const isEmpty = groupEntities.length === 0
          const isExpanded = isGroupExpanded(groupValue, isEmpty)

          return (
            <div key={groupValue} className={clsx({ isCollapsed: !isExpanded })}>
              <VPGridGroupHeader
                label={group.label || groupValue}
                value={groupValue}
                icon={group.icon}
                color={group.color}
                count={groupBy !== 'taskType' ? group.count : undefined} // taskType group counts are unreliable as they use counts from tasks
                isExpanded={isExpanded}
                onToggle={() => handleGroupToggle(groupValue)}
              />
              {isExpanded && (
                <GridLayout ratio={1.777777} minWidth={gridHeight} style={{ outline: 'none' }}>
                  {groupEntities.map((entity, index) => (
                    <VPGridCard
                      key={entity.id}
                      entity={entity}
                      index={index}
                      projectInfo={projectInfo}
                      isEntitySelected={isEntitySelected}
                      handleCardClick={handleCardClick}
                      handleDoubleClick={handleDoubleClick}
                      handleContextMenu={handleGridContextMenu}
                      gridColumnId={GRID_COLUMN_ID}
                      rowSelectionColumnId={ROW_SELECTION_COLUMN_ID}
                    />
                  ))}
                </GridLayout>
              )}
            </div>
          )
        })}
      </GridContainer>
    )
  }

  // Render without grouping (original behavior)
  return (
    <GridContainer>
      <GridLayout
        ref={gridContainerRef}
        ratio={1.777777}
        minWidth={gridHeight}
        onScroll={handleScroll}
        data-grid-container="true"
      >
        {gridData.map((entity, index) => (
          <VPGridCard
            key={entity.id}
            entity={entity}
            index={index}
            projectInfo={projectInfo}
            root={gridContainerRef.current}
            isEntitySelected={isEntitySelected}
            handleCardClick={handleCardClick}
            handleDoubleClick={handleDoubleClick}
            handleContextMenu={handleGridContextMenu}
            gridColumnId={GRID_COLUMN_ID}
            rowSelectionColumnId={ROW_SELECTION_COLUMN_ID}
          />
        ))}
      </GridLayout>
    </GridContainer>
  )
}

export default VPGrid
