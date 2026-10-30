// Addon keyboard shortcuts on the project tables' cells (table.shortcut slot, @ynput/ayon-addon).
// Listens like useKeyboardNavigation (keys pressed in a body cell, not while editing), in the
// capture phase so a matched key doesn't also reach the app's global shortcuts. The manifest
// check keeps addons off the table's own keys.
import { useEffect } from 'react'
import type { RefObject } from 'react'
import type { ProjectTablePage, TableRowRef } from '@ynput/ayon-addon'
import { useProjectContext } from '@shared/context'
import { AddonDialog } from '@shared/components/AddonLayout/AddonDialog'
import { useAddonTableShortcuts } from '@shared/components/AddonLayout/useAddonTableShortcuts'
import { useSelectionCellsContext } from '../context/selection-cells'
import { useCellEditing } from '../context/cell-editing'
import { useProjectTableContext } from '../context/project-table'
import { parseCellId } from '../utils/cellUtils'
import { ROW_SELECTION_COLUMN_ID } from '../constants'
import { GROUP_BY_ID } from '../hooks/useBuildGroupByTableData'

const isTextInput = (target: HTMLElement) =>
  target.tagName === 'INPUT' ||
  target.tagName === 'TEXTAREA' ||
  target.isContentEditable ||
  target.getAttribute('role') === 'textbox'

interface AddonCellShortcutsProps {
  page: ProjectTablePage
  /** the table's container: keys pressed in other tables on the page (the slicer) are theirs */
  containerRef: RefObject<HTMLElement>
}

export const AddonCellShortcuts = ({ page, containerRef }: AddonCellShortcutsProps) => {
  const { projectName } = useProjectContext()
  const { getEntityById } = useProjectTableContext()
  const { focusedCellId, selectedCells } = useSelectionCellsContext()
  const { editingCellId } = useCellEditing()
  const { hasShortcuts, handleShortcut, dialog } = useAddonTableShortcuts(page)

  useEffect(() => {
    if (!hasShortcuts || dialog) return
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (!target || !containerRef.current?.contains(target)) return
      if (!target.closest('tbody td') || isTextInput(target) || editingCellId) return

      handleShortcut(event, () => {
        const focused = focusedCellId ? parseCellId(focusedCellId) : null
        if (!focused || focused.rowId.startsWith(GROUP_BY_ID)) return undefined

        // list items resolve to their entity, like the right-click menu
        const toRow = (rowId: string): TableRowRef | undefined => {
          if (rowId.startsWith(GROUP_BY_ID)) return undefined
          const entity = getEntityById(rowId) as
            | (Record<string, unknown> & { id?: string; entityId?: string; entityType?: string })
            | undefined
          if (!entity) return undefined
          return {
            id: entity.entityId || entity.id || rowId,
            entityType: entity.entityType,
            name: typeof entity.name === 'string' ? entity.name : undefined,
            label: typeof entity.label === 'string' && entity.label ? entity.label : undefined,
            data: entity,
          }
        }

        const selected = [...selectedCells].flatMap((cellId) => parseCellId(cellId) || [])
        // the selected rows when the key was pressed in one of them, else the focused row
        const inSelection = selected.some(({ rowId }) => rowId === focused.rowId)
        const rowIds = inSelection
          ? [...new Set(selected.map(({ rowId }) => rowId))]
          : [focused.rowId]
        const rows = [
          ...new Map(
            rowIds.flatMap((rowId) => toRow(rowId) || []).map((row) => [row.id, row]),
          ).values(),
        ]
        const cells = (inSelection ? selected : [{ rowId: focused.rowId, colId: focused.colId }])
          .filter(
            ({ rowId, colId }) =>
              colId !== ROW_SELECTION_COLUMN_ID && !rowId.startsWith(GROUP_BY_ID),
          )
          .flatMap(({ rowId, colId }) => {
            const row = toRow(rowId)
            return row ? [{ rowId: row.id, columnId: colId }] : []
          })
        const focusedRow = toRow(focused.rowId)
        if (!focusedRow) return undefined

        return {
          projectName,
          rows,
          focused: { rowId: focusedRow.id, columnId: focused.colId },
          cells,
        }
      })
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [
    containerRef,
    hasShortcuts,
    dialog,
    handleShortcut,
    editingCellId,
    focusedCellId,
    selectedCells,
    getEntityById,
    projectName,
  ])

  return dialog ? <AddonDialog contribution={dialog.contribution} context={dialog.context} /> : null
}
