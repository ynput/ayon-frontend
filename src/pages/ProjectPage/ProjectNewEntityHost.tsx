import { useMemo } from 'react'
import { type OperationResponseModel } from '@shared/api'
import {
  getCellId,
  useOptionalProjectTableContext,
  useOptionalSelectionCellsContext,
} from '@shared/containers/ProjectTreeTable'
import { NewEntity, type NewEntityProps } from '@shared/containers/NewEntity'
import { useNewEntityContext } from '@shared/containers/NewEntity'
import { parseCellId } from '@shared/containers/ProjectTreeTable/utils/cellUtils'

export const ProjectNewEntityHost = (props: NewEntityProps) => {
  const projectTableContext = useOptionalProjectTableContext()
  const selectionContext = useOptionalSelectionCellsContext()
  const { parentFolderIds } = useNewEntityContext()

  const handleNewEntities = useMemo(
    () => (ops: OperationResponseModel[], stayOpen: boolean, createdInFolderIds: string[]) => {
      if (!projectTableContext || !selectionContext) return

      // explicit parents (context menu) or the folders resolved from the selection (toolbar "Create")
      const parentIds = parentFolderIds ?? createdInFolderIds

      const selectedCellRowIds = new Set(
        Array.from(selectionContext.selectedCells)
          .map((cellId) => parseCellId(cellId)?.rowId)
          .filter((rowId): rowId is string => !!rowId),
      )
      const shouldExpandParents =
        parentIds.length > 0 && parentIds.every((parentId) => selectedCellRowIds.has(parentId))

      if (
        shouldExpandParents &&
        projectTableContext.expanded &&
        typeof projectTableContext.expanded !== 'boolean'
      ) {
        const expanded = { ...projectTableContext.expanded }
        if (projectTableContext.expanded) {
          for (const parentId of parentIds) expanded[parentId] = true
          projectTableContext.setExpanded(expanded)
        }
      }

      if (!stayOpen) {
        const newSelection = new Set<string>()
        for (const op of ops) {
          if (op.entityId && op.entityType === 'folder') {
            newSelection.add(getCellId(op.entityId, 'name'))
          }
        }
        if (newSelection.size) {
          selectionContext.setSelectedCells(newSelection)
          selectionContext.setFocusedCellId(newSelection.values().next().value || null)
        }
      }
    },
    [parentFolderIds, projectTableContext, selectionContext],
  )

  return <NewEntity {...props} onNewEntities={handleNewEntities} />
}
