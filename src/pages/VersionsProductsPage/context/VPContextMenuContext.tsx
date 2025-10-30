import { createContext, FC, ReactNode, useCallback, useContext } from 'react'
import {
  useProjectDataContext,
  ContextMenuItemConstructor,
  getCellId,
  ROW_SELECTION_COLUMN_ID,
  useSelectionCellsContext,
  useProjectTableContext,
  getEntityViewierIds,
} from '@shared/containers'
import { useVersionsDataContext } from './VPDataContext'
import { useEntityListsContext } from '@pages/ProjectListsPage/context'
import { confirmDelete } from '@shared/util'
import { useDeleteVersionMutation } from '@shared/api'

interface VPContextMenuContextValue {
  // Unified context menu items (using ContextMenuItemConstructor)
  showDetailsItem: ContextMenuItemConstructor
  openViewerItem: ContextMenuItemConstructor
  addToListItem: ContextMenuItemConstructor
  deleteVersionItem: ContextMenuItemConstructor
}

const VPContextMenuContext = createContext<VPContextMenuContextValue | null>(null)

export const useVPContextMenuContext = () => {
  const context = useContext(VPContextMenuContext)
  if (!context) {
    throw new Error('useVPContextMenuContext must be used within VPContextMenuProvider')
  }
  return context
}

interface VPContextMenuProviderProps {
  children: ReactNode
}

export const VPContextMenuProvider: FC<VPContextMenuProviderProps> = ({ children }) => {
  const { selectedCells, setSelectedCells, selectCell } = useSelectionCellsContext()
  const { entitiesMap } = useVersionsDataContext()
  const { buildAddToListMenu, buildHierarchicalMenuItems, newListMenuItem, versions, reviews } =
    useEntityListsContext()
  const { onOpenPlayer } = useProjectTableContext()
  const { projectName } = useProjectDataContext()
  const [deleteVersion] = useDeleteVersionMutation()

  // Shared delete version handler
  const handleDeleteVersion = useCallback(
    async (versionId: string, versionName: string) => {
      confirmDelete({
        label: `version ${versionName}`,
        accept: async () => {
          await deleteVersion({ versionId, projectName }).unwrap()
          // Cache invalidation will automatically update the UI
        },
      })
    },
    [deleteVersion, projectName],
  )

  // Show details context menu item
  const showDetailsItem: ContextMenuItemConstructor = useCallback(
    (_e: any, cell: any, _selected: any, meta: any) => ({
      label: 'Show details',
      icon: 'dock_to_left',
      shortcut: 'Double click',
      command: () => {
        // For grid view, we need to add row selection cells for all selected entities
        if (meta.selectedRows.length > 0) {
          const selectedRows = new Set<string>()
          for (const entityId of meta.selectedRows) {
            const rowSelectionCellId = getCellId(entityId, ROW_SELECTION_COLUMN_ID)
            selectedRows.add(rowSelectionCellId)
          }
          setSelectedCells(new Set<string>([...selectedCells, ...selectedRows]))
        } else {
          // For table view, select the row to open details
          const rowSelectionCellId = getCellId(cell.entityId, ROW_SELECTION_COLUMN_ID)
          selectCell(rowSelectionCellId, false, false)
        }
      },
      hidden: meta.selectedRows.length > 1 || cell.isGroup,
    }),
    [setSelectedCells, selectCell, selectedCells],
  )

  // Open viewer context menu item
  const openViewerItem: ContextMenuItemConstructor = useCallback(
    (_e: any, cell: any, _selected: any, meta: any) => {
      // Use the first selected row or the cell entity
      const targetEntityId = meta.selectedRows[0] || cell.entityId
      let targetEntity = entitiesMap.get(targetEntityId)

      // If we found a product, check if it has a featured version
      if (targetEntity?.entityType === 'product') {
        const product = targetEntity as any
        if (product.featuredVersion?.id) {
          targetEntity = entitiesMap.get(product.featuredVersion.id)
        } else {
          return undefined
        }
      }

      if (!targetEntity || targetEntity.entityType !== 'version') {
        return undefined
      }

      return {
        label: 'Open in viewer',
        icon: 'play_circle',
        shortcut: 'Spacebar',
        command: () => {
          if (onOpenPlayer && targetEntity) {
            const targetIds = getEntityViewierIds(targetEntity as any)
            onOpenPlayer(targetIds, { quickView: true })
          }
        },
        hidden: cell.isGroup,
      }
    },
    [entitiesMap, onOpenPlayer],
  )

  // Add to list context menu item
  const addToListItem: ContextMenuItemConstructor = useCallback(
    (_e: any, cell: any, _selected: any, meta: any) => {
      // Get selected entity IDs from meta
      const selectedEntityIds = meta.selectedRows.length > 0 ? meta.selectedRows : [cell.entityId]

      // Filter to only version entities, converting products to their featuredVersion
      const versionEntities: { entityId: string; entityType: string | undefined }[] = []
      let singleVersionName: string | undefined

      for (const entityId of selectedEntityIds) {
        const entity = entitiesMap.get(entityId)
        if (!entity) continue

        if (entity.entityType === 'version') {
          versionEntities.push({ entityId: entity.id, entityType: 'version' })
          if (versionEntities.length === 1) {
            singleVersionName = entity.name
          }
        } else if (entity.entityType === 'product' && 'featuredVersion' in entity) {
          const product = entity as any
          if (product.featuredVersion?.id) {
            versionEntities.push({
              entityId: product.featuredVersion.id,
              entityType: 'version',
            })
            if (versionEntities.length === 1) {
              singleVersionName = product.featuredVersion.name
            }
          }
        }
      }

      // If no version entities, disable the menu
      if (versionEntities.length === 0) {
        return {
          id: 'add-to-list',
          label: 'Add to list',
          icon: 'list',
          disabled: true,
          items: [],
        }
      }

      // Build the menu items for add to list using versions and reviews data
      const combined = [...versions.data, ...reviews.data]
      const menuItems = buildHierarchicalMenuItems(combined, versionEntities, (list) => {
        return list.entityListType === 'review-session' ? true : !!reviews.data.length
      })
      menuItems.push(newListMenuItem('version', versionEntities))

      // Include version name in label if only one version
      const label =
        versionEntities.length === 1 && singleVersionName
          ? `Add to list (${singleVersionName})`
          : 'Add to list'

      return buildAddToListMenu(menuItems, { label })
    },
    [
      entitiesMap,
      buildAddToListMenu,
      buildHierarchicalMenuItems,
      newListMenuItem,
      versions.data,
      reviews.data,
    ],
  )

  // Delete version context menu item
  const deleteVersionItem: ContextMenuItemConstructor = useCallback(
    (_e: any, cell: any, _selected: any, meta: any) => {
      // Only show for single version selection
      if (meta.selectedRows.length !== 1 || cell.entityType !== 'version') {
        return undefined
      }

      const entity = entitiesMap.get(cell.entityId)
      if (!entity || entity.entityType !== 'version') {
        return undefined
      }

      return {
        label: `Delete version (${entity.name})`,
        icon: 'delete',
        danger: true,
        command: () => handleDeleteVersion(entity.id, entity.name),
        hidden: cell.columnId !== 'name' || cell.isGroup,
      }
    },
    [entitiesMap, handleDeleteVersion],
  )

  const value: VPContextMenuContextValue = {
    showDetailsItem,
    openViewerItem,
    addToListItem,
    deleteVersionItem,
  }

  return <VPContextMenuContext.Provider value={value}>{children}</VPContextMenuContext.Provider>
}
