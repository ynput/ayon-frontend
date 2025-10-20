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

interface VersionsGridProps {}

const VersionsGrid: FC<VersionsGridProps> = ({}) => {
  const { projectName, projectInfo } = useProjectDataContext()
  const { productsMap, versionsMap } = useVersionsDataContext()
  const { showStacked } = useVersionsViewsContext()
  const { selectedCells, setSelectedCells, setFocusedCellId } = useSelectionCellsContext()

  // Track the last clicked item for shift-click range selection
  const lastClickedIndexRef = useRef<number | null>(null)

  const gridData = useMemo(
    () =>
      buildVersionAndProductGrid({
        productsMap,
        versionsMap,
        showProducts: showStacked,
        projectName,
      }),
    [productsMap, versionsMap, showStacked, projectName],
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

  // Check if an entity is selected
  const isEntitySelected = useCallback(
    (entityId: string, entityType: string): boolean => {
      if (entityType === 'version') {
        return Array.from(selectedCells).some((cellId) => cellId.includes(entityId))
      } else if (entityType === 'product') {
        // For products, check if any of its versions are selected
        const product = productsMap.get(entityId)
        if (product) {
          for (const version of product.versions) {
            return Array.from(selectedCells).some((cellId) => cellId.includes(version.id))
          }
        }
        return false
      } else {
        return false
      }
    },
    [selectedCells],
  )

  return (
    <GridLayout
      ratio={1.777777}
      minWidth={190}
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

export default VersionsGrid
