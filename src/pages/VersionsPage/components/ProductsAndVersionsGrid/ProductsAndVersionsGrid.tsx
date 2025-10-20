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

const GRID_COLUMN_ID = 'name'

interface ProductsAndVersionsGridProps {}

const ProductsAndVersionsGrid: FC<ProductsAndVersionsGridProps> = ({}) => {
  const { projectName, projectInfo } = useProjectDataContext()
  const { productsMap, versionsMap, isLoading, fetchNextPage } = useVersionsDataContext()
  const { showProducts } = useVersionsViewsContext()
  const { selectedCells, setSelectedCells, setFocusedCellId } = useSelectionCellsContext()

  // Track the last clicked item for shift-click range selection
  const lastClickedIndexRef = useRef<number | null>(null)

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
    },
    [gridData, setSelectedCells, setFocusedCellId, selectedCells],
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
    },
    [setFocusedCellId],
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
        ratio={1.777777}
        minWidth={190}
        onScroll={handleScroll}
        style={{ maxHeight: '100%', height: 'auto', overflow: 'hidden' }}
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
      ratio={1.777777}
      minWidth={190}
      onScroll={handleScroll}
      style={{ maxHeight: '100%', height: 'auto', overflow: 'auto' }}
    >
      {gridData.map((entity, index) => {
        const status = projectInfo?.statuses?.find((s) => s.name === entity.status)

        return (
          <EntityCard
            key={entity.id}
            style={{
              minWidth: 'unset',
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
            onTitleClick={(e) => handleCardClick(e, entity.id, index, ROW_SELECTION_COLUMN_ID)}
            onVersionsClick={(e) => handleCardClick(e, entity.id, index, ROW_SELECTION_COLUMN_ID)}
            onDoubleClick={(e) => handleDoubleClick(e, entity.id)}
          />
        )
      })}
    </GridLayout>
  )
}

export default ProductsAndVersionsGrid
