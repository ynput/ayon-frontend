import { useRef, type DragEvent } from 'react'
import { useOptionalProjectContext } from '@shared/context'
import { setEntityDragData } from '@shared/components/MarkdownEditor/links/entityLinks'
import type { MentionEntityRef } from '@shared/components/MarkdownEditor/types'
import { useOptionalSelectionCellsContext } from '../context/selection-cells/SelectionCellsContext'
import { useOptionalProjectTableContext } from '../context/project-table/ProjectTableContextInstance'
import { getCellId, parseCellId } from '../utils/cellUtils'

// entity types an editor can mention
const DRAG_TYPES = ['folder', 'task', 'version']

/**
 * Drags the entity of a row, e.g. into a comment, which mentions it. When its name was selected
 * before the drag, all the selected rows are dragged (the table keeps the selection then).
 */
export const useEntityDrag = (rowId: string, entity: { id: string; entityType: string }) => {
  const projectName = useOptionalProjectContext()?.projectName
  const selection = useOptionalSelectionCellsContext()
  const table = useOptionalProjectTableContext()

  const canDrag = !!projectName && DRAG_TYPES.includes(entity.entityType)

  // the rows to drag, read before the press changes the selection
  const rowsRef = useRef<string[]>([rowId])
  const onMouseDown = () => {
    if (!selection?.isCellSelected(getCellId(rowId, 'name'))) {
      rowsRef.current = [rowId]
      return
    }
    const selectedRows = new Set(
      Array.from(selection.selectedCells).flatMap((cellId) => {
        const id = parseCellId(cellId)?.rowId
        return id ? [id] : []
      }),
    )
    // in the order of the table
    const rowIndex = (id: string) => selection.gridMap.rowIdToIndex.get(id) ?? 0
    rowsRef.current = Array.from(selectedRows).sort((a, b) => rowIndex(a) - rowIndex(b))
  }

  const onDragStart = (event: DragEvent) => {
    // not a cell selection or column drag
    event.stopPropagation()
    if (!projectName || !canDrag) return event.preventDefault()

    const rows = rowsRef.current.includes(rowId) ? rowsRef.current : [rowId]
    const refs: MentionEntityRef[] = rows.flatMap((id) => {
      const rowEntity =
        id === rowId ? { entityType: entity.entityType, id: entity.id } : table?.getEntityById(id)
      if (!rowEntity || !DRAG_TYPES.includes(rowEntity.entityType)) return []
      const entityId = 'entityId' in rowEntity ? rowEntity.entityId : rowEntity.id
      return [{ projectName, type: rowEntity.entityType, id: entityId }]
    })
    setEntityDragData(event.dataTransfer, refs)
  }

  return canDrag ? { draggable: true, onMouseDown, onDragStart } : {}
}
