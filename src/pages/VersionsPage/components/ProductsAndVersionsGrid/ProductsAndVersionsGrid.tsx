import GridLayout from '@components/GridLayout'
import { useVersionsDataContext } from '../../context/VersionsDataContext'
import { useVersionsViewsContext } from '../../context/VersionsViewsContext'
import { buildVersionAndProductGrid } from '../../util'
import {
  ROW_SELECTION_COLUMN_ID,
  useProjectDataContext,
  useSelectionCellsContext,
} from '@shared/containers'
import { EntityCard } from '@ynput/ayon-react-components'
import { FC, useMemo, useCallback, useRef } from 'react'
import { getCellId } from '@shared/containers/ProjectTreeTable/utils/cellUtils'
import { InView } from 'react-intersection-observer'
import { useGridKeyboardNavigation } from '../../hooks/useGridKeyboardNavigation'

const GRID_COLUMN_ID = 'name'

interface ProductsAndVersionsGridProps {}

const ProductsAndVersionsGrid: FC<ProductsAndVersionsGridProps> = ({}) => {
  const { projectName, projectInfo } = useProjectDataContext()
  const { productsMap, versionsMap, isLoading, fetchNextPage } = useVersionsDataContext()
  const { showProducts, gridHeight } = useVersionsViewsContext()
  const { selectedCells, setSelectedCells, setFocusedCellId } = useSelectionCellsContext()

  // Track the last clicked item for shift-click range selection
  const lastClickedIndexRef = useRef<number | null>(null)
  const gridContainerRef = useRef<HTMLDivElement>(null)

  const gridData = useMemo(
    () =>
      buildVersionAndProductGrid({
        productsMap,
        versionsMap,
        showProducts: showProducts,
        projectName,
      }),
    [productsMap, versionsMap, showProducts, projectName],
  )

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

  // Initialize keyboard navigation early to get reset function
  const { resetPositionTracking } = useGridKeyboardNavigation({
    gridData,
    selectedCells,
    setSelectedCells,
    setFocusedCellId,
    gridContainerRef,
    onEnterPress: handleEnterPress,
    gridColumnId: GRID_COLUMN_ID,
    rowSelectionColumnId: ROW_SELECTION_COLUMN_ID,
  })

  // Handle card click with support for single, shift, and cmd/ctrl selection
  const handleCardClick = useCallback(
    (e: React.MouseEvent, entityId: string, index: number, columnId: string) => {
      e.stopPropagation()

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
          const id = gridData[i]?.id
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
      gridData,
      setSelectedCells,
      setFocusedCellId,
      selectedCells,
      gridContainerRef,
      resetPositionTracking,
    ],
  )

  // handle double click which selected the name and row selection cell
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent, entityId: string) => {
      e.stopPropagation()

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

  // return a pages worth of loading skeletons
  if (isLoading) {
    return (
      <GridLayout
        ref={gridContainerRef}
        ratio={1.777777}
        minWidth={190}
        onScroll={handleScroll}
        style={{ maxHeight: '100%', height: 'auto', overflow: 'hidden', outline: 'none' }}
        tabIndex={0}
      >
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
    )
  }

  return (
    <GridLayout
      ref={gridContainerRef}
      ratio={1.777777}
      minWidth={gridHeight}
      onScroll={handleScroll}
      style={{ maxHeight: '100%', height: 'auto', overflow: 'auto', outline: 'none' }}
      tabIndex={0}
      data-grid-container="true"
    >
      {gridData.map((entity, index) => {
        const status = projectInfo?.statuses?.find((s) => s.name === entity.status)

        return (
          <InView key={entity.id} rootMargin="200px 0px 200px 0px">
            {({ inView, ref }) =>
              inView ? (
                <div ref={ref} data-entity-id={entity.id}>
                  <EntityCard
                    style={{
                      minWidth: 'unset',
                      maxHeight: 'unset',
                      minHeight: 90,
                      maxWidth: 'unset',
                    }}
                    // data built in util transform function
                    header={entity.header}
                    path={entity.path}
                    title={entity.title}
                    titleIcon={entity.icon}
                    imageIcon={entity.icon}
                    status={status}
                    imageUrl={entity.thumbnailUrl}
                    isPlayable={entity.isPlayable}
                    users={entity.author ? [{ name: entity.author }] : undefined} // versions only
                    versions={entity.versions} // products only
                    // for all types
                    hidePriority
                    // selection
                    isActive={isEntitySelected(entity.id, entity.entityType)}
                    // events
                    onClick={(e) => handleCardClick(e, entity.id, index, GRID_COLUMN_ID)}
                    onTitleClick={(e) =>
                      handleCardClick(e, entity.id, index, ROW_SELECTION_COLUMN_ID)
                    }
                    onVersionsClick={(e) =>
                      handleCardClick(e, entity.id, index, ROW_SELECTION_COLUMN_ID)
                    }
                    onDoubleClick={(e) => handleDoubleClick(e, entity.id)}
                  />
                </div>
              ) : (
                <div
                  ref={ref}
                  style={{
                    minWidth: 'unset',
                    aspectRatio: '1.777777',
                    backgroundColor: 'transparent',
                  }}
                />
              )
            }
          </InView>
        )
      })}
    </GridLayout>
  )
}

export default ProductsAndVersionsGrid
