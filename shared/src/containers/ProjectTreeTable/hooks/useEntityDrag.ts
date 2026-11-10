import { useRef, type DragEvent } from 'react'
import { useOptionalProjectContext } from '@shared/context'
import {
  setEntityDragData,
  type DraggedEntity,
} from '@shared/components/MarkdownEditor/links/entityLinks'
import { useOptionalSelectionCellsContext } from '../context/selection-cells/SelectionCellsContext'
import { useOptionalProjectTableContext } from '../context/project-table/ProjectTableContextInstance'
import { getCellId, parseCellId } from '../utils/cellUtils'
import { ROW_SELECTION_COLUMN_ID } from '../constants'

// entity types an editor can mention
const DRAG_TYPES = ['folder', 'task', 'version']

// the class of the entity being dragged, shown as it was hovered
export const ENTITY_DRAG_PREVIEW_CLASS = 'entity-drag-preview'

// the dragged entity under the pointer, with the number of the others
const setDragPreview = (event: DragEvent<HTMLElement>, count: number) => {
  const source = event.currentTarget
  const rect = source.getBoundingClientRect()
  const preview = source.cloneNode(true) as HTMLElement
  preview.classList.add(ENTITY_DRAG_PREVIEW_CLASS)
  Object.assign(preview.style, {
    position: 'fixed',
    top: '-1000px',
    left: '0',
    // room for its padding and count
    width: 'auto',
    maxWidth: `${rect.width + 48}px`,
    height: `${rect.height}px`,
  })
  if (count > 1) {
    const badge = document.createElement('span')
    badge.className = 'count'
    badge.textContent = `+${count - 1}`
    preview.append(badge)
  }
  document.body.append(preview)
  event.dataTransfer.setDragImage(preview, event.clientX - rect.left, event.clientY - rect.top)
  // the browser takes its image when the event ends
  setTimeout(() => preview.remove())
}

/**
 * Drags the entity of a row, e.g. into a comment, which mentions it. When its name was selected
 * before the drag, the rows of all the selected cells are dragged (the table keeps the selection
 * then). Row checkboxes are ignored, as in context menus.
 */
export const useEntityDrag = (
  rowId: string,
  entity: { id: string; entityType: string; name: string; label?: string | null },
) => {
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
        const cell = parseCellId(cellId)
        return cell && cell.colId !== ROW_SELECTION_COLUMN_ID ? [cell.rowId] : []
      }),
    )
    // in the order of the table
    const rowIndex = (id: string) => selection.gridMap.rowIdToIndex.get(id) ?? 0
    rowsRef.current = Array.from(selectedRows).sort((a, b) => rowIndex(a) - rowIndex(b))
  }

  const onDragStart = (event: DragEvent<HTMLElement>) => {
    // not a cell selection or column drag
    event.stopPropagation()
    if (!projectName || !canDrag) return event.preventDefault()

    const rows = rowsRef.current.includes(rowId) ? rowsRef.current : [rowId]
    const entities: DraggedEntity[] = rows.flatMap((id) => {
      const rowEntity = id === rowId ? entity : table?.getEntityById(id)
      if (!rowEntity || !DRAG_TYPES.includes(rowEntity.entityType)) return []
      const entityId = 'entityId' in rowEntity ? String(rowEntity.entityId) : rowEntity.id
      const label = ('label' in rowEntity && rowEntity.label) || rowEntity.name
      return [{ projectName, type: rowEntity.entityType, id: entityId, label }]
    })
    setEntityDragData(event.dataTransfer, entities)
    setDragPreview(event, entities.length)
  }

  return canDrag ? { draggable: true, onMouseDown, onDragStart } : {}
}
