import { useCallback } from 'react'
import { prefetchPiece, runContribution, useContributions } from '@ynput/ayon-addon'
import type { EntityRef, ProjectTablePage } from '@ynput/ayon-addon'
import { useProjectContext } from '@shared/context'
import type { ContextMenuItemConstructor } from './useCellContextMenu'
import { appliesToPage } from '../addonColumns/addonColumnsHelpers'

/**
 * Items addons contribute to the cells' right-click menu (entityMenuItem slot, @ynput/ayon-addon),
 * as one constructor a page adds to its contextMenuItems. The items draw from their descriptions;
 * `run` starts loading when the menu opens.
 */
export const useAddonEntityMenuItems = (page: ProjectTablePage): ContextMenuItemConstructor => {
  const { contributions } = useContributions('entityMenuItem')
  const { projectName } = useProjectContext()

  return useCallback<ContextMenuItemConstructor>(
    (_e, cell, selectedCells, meta) => {
      const items = contributions.filter((item) => appliesToPage(item, page))
      if (!items.length) return undefined

      // like the built-in items: the selected cells (not row checkboxes), else the selected rows,
      // else the clicked cell; each entity once (several cells of a row are one entity)
      const selectedCellIds = new Set(meta.selectedCells)
      const cells = selectedCells.filter((selected) => selectedCellIds.has(selected.cellId))
      const source = cells.length ? cells : selectedCells.length ? selectedCells : [cell]
      const entities = new Map<string, EntityRef>()
      for (const selected of source) {
        const { entityId, entityType, isGroup, data } = selected
        if (isGroup || !entityId || !entityType || entityType === 'unknown') continue
        const entityData = data as { name?: string; label?: string | null } | undefined
        entities.set(`${entityType}:${entityId}`, {
          id: entityId,
          entityType,
          projectName,
          name: entityData?.name,
          label: entityData?.label || undefined,
        })
      }
      const selection = [...entities.values()]
      if (!selection.length) return undefined

      const context = { projectName, page, entities: selection }
      return items
        .filter(
          (item) =>
            (item.selection !== 'single' || selection.length === 1) &&
            (!item.entityTypes?.length ||
              selection.every((entity) => item.entityTypes!.includes(entity.entityType))),
        )
        .map((item) => {
          prefetchPiece(item.run)
          return {
            id: item.key,
            label: item.label,
            icon: item.icon,
            command: () => runContribution(item, context),
          }
        })
    },
    [contributions, projectName, page],
  )
}
