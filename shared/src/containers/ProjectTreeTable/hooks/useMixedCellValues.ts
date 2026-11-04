import { useRef } from 'react'
import { getMixedCounts, type MixedChange } from '@ynput/ayon-react-components'
import { useSelectionCellsContext } from '../context/selection-cells/SelectionCellsContext'
import { useProjectTableContext } from '../context/project-table/ProjectTableContextInstance'
import { parseCellId, parseScopedColumnId } from '../utils/cellUtils'
import type { EntityMap } from '../types'

// a list value (tags, assignees, list attributes) edited in several selected cells of one column
export type MixedCellValues = {
  cellIds: string[]
  counts: Record<string, number>
  total: number
  label: string
}

// values to add to and remove from each of the cells, instead of one value for all of them
export type ListChange = MixedChange & { cellIds: string[] }

export const getEntityListValue = (entity: EntityMap, columnId: string): string[] => {
  const { field, isAttrib } = parseScopedColumnId(columnId)
  const source = entity as unknown as Record<string, any>
  const value = isAttrib ? source.attrib?.[field] : source[field]
  return Array.isArray(value) ? value.map(String) : []
}

// Taken when the editor opens and kept until it closes: clicking another cell closes the editor
// after that click has moved the selection, and the change belongs to the cells the counts came from.
export const useMixedCellValues = (
  cellId: string,
  columnId: string,
  isEditing: boolean,
): MixedCellValues | undefined => {
  const { selectedCells } = useSelectionCellsContext()
  const { getEntityById } = useProjectTableContext()
  const snapshot = useRef<{ value?: MixedCellValues }>()

  if (!isEditing) {
    snapshot.current = undefined
    return undefined
  }
  if (snapshot.current) return snapshot.current.value

  const cellIds: string[] = []
  const values: string[][] = []
  const types = new Set<string>()
  if (selectedCells.has(cellId)) {
    for (const selectedCellId of selectedCells) {
      const { rowId, colId } = parseCellId(selectedCellId) || {}
      if (!rowId || colId !== columnId) continue
      const entity = getEntityById(rowId)
      if (!entity) continue
      cellIds.push(selectedCellId)
      values.push(getEntityListValue(entity, columnId))
      types.add(entity.entityType)
    }
  }

  const [type] = types
  snapshot.current = {
    value:
      cellIds.length > 1
        ? {
            cellIds,
            counts: getMixedCounts(values),
            total: cellIds.length,
            label: types.size === 1 ? `${type}s` : 'items',
          }
        : undefined,
  }
  return snapshot.current.value
}
