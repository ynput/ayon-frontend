import { useCallback } from 'react'
import {
  ContextMenuItemType,
  useCreateContextMenu,
  getCellId,
  parseCellId,
  ROW_SELECTION_COLUMN_ID,
  useSelectionCellsContext,
  useProjectTableContext,
  getEntityViewierIds,
} from '@shared/containers'
import { useVersionsDataContext } from '../context/VPDataContext'
import { useEntityListsContext } from '@pages/ProjectListsPage/context'

const GRID_COLUMN_ID = 'name'

export const useVPGridContextMenu = () => {
  const { selectedCells, setSelectedCells, setFocusedCellId } = useSelectionCellsContext()
  const { entitiesMap } = useVersionsDataContext()
  const { buildAddToListMenu, buildHierarchicalMenuItems, newListMenuItem, versions, reviews } =
    useEntityListsContext()
  const { onOpenPlayer } = useProjectTableContext()
  const [ctxMenuShow] = useCreateContextMenu([])

  // Get all selected entity IDs from the selectedCells set
  const getSelectedEntityIds = useCallback((): string[] => {
    const entityIds = new Set<string>()
    Array.from(selectedCells).forEach((cellId) => {
      const parsed = parseCellId(cellId)
      if (parsed?.rowId) {
        entityIds.add(parsed.rowId)
      }
    })
    return Array.from(entityIds)
  }, [selectedCells])

  // Build add to list menu items
  const buildAddToListItem = useCallback(
    (selectedEntityIds: string[]): ContextMenuItemType | undefined => {
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

  const showDetailsItem = useCallback(
    (selectedEntityIds: string[]): ContextMenuItemType => ({
      label: 'Show details',
      icon: 'dock_to_left',
      shortcut: 'Double click',
      command: () => {
        // set row selection for all selected entities
        const selectedRows = new Set<string>()
        for (const entityId of selectedEntityIds) {
          const rowSelectionCellId = getCellId(entityId, ROW_SELECTION_COLUMN_ID)
          selectedRows.add(rowSelectionCellId)
        }

        setSelectedCells(new Set<string>([...selectedCells, ...selectedRows]))
      },
    }),
    [setSelectedCells, selectedCells],
  )

  const openViewerItem = useCallback(
    (selectedEntityIds: string[]): ContextMenuItemType | undefined => {
      // Find the first version or product entity
      let targetEntity = selectedEntityIds
        .map((id) => entitiesMap.get(id))
        .find((entity) => entity?.entityType === 'version' || entity?.entityType === 'product')

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
      }
    },
    [entitiesMap, onOpenPlayer],
  )

  const handleGridContextMenu = useCallback(
    (e: React.MouseEvent, entityId: string) => {
      e.preventDefault()
      e.stopPropagation()

      const selectedEntityIds = getSelectedEntityIds()

      // Check if details panel is already open (has row selection cells)
      const hasRowSelection = Array.from(selectedCells).some((id) =>
        id.includes(ROW_SELECTION_COLUMN_ID),
      )

      // If the right-clicked item is not in the current selection, update selection to just this item
      if (!selectedEntityIds.includes(entityId)) {
        const nameCellId = getCellId(entityId, GRID_COLUMN_ID)
        const newSelection = new Set<string>([nameCellId])

        // Only add row selection cell if details panel is already open
        if (hasRowSelection) {
          const rowCellId = getCellId(entityId, ROW_SELECTION_COLUMN_ID)
          newSelection.add(rowCellId)
        }

        setSelectedCells(newSelection)
        setFocusedCellId(nameCellId)

        // Update the selected entity IDs to just this one
        const updatedSelectedIds = [entityId]
        const menuItems: ContextMenuItemType[] = [showDetailsItem(updatedSelectedIds)]

        const openViewerMenuItem = openViewerItem(updatedSelectedIds)
        if (openViewerMenuItem) {
          menuItems.push(openViewerMenuItem)
        }

        const addToListItem = buildAddToListItem(updatedSelectedIds)
        if (addToListItem) {
          menuItems.push(addToListItem)
        }

        ctxMenuShow(e, menuItems)
      } else {
        // Right-click is within the current selection, show menu for all selected items
        const menuItems: ContextMenuItemType[] = [showDetailsItem(selectedEntityIds)]

        const openViewerMenuItem = openViewerItem(selectedEntityIds)
        if (openViewerMenuItem) {
          menuItems.push(openViewerMenuItem)
        }

        const addToListItem = buildAddToListItem(selectedEntityIds)
        if (addToListItem) {
          menuItems.push(addToListItem)
        }

        ctxMenuShow(e, menuItems)
      }
    },
    [
      ctxMenuShow,
      showDetailsItem,
      buildAddToListItem,
      openViewerItem,
      getSelectedEntityIds,
      setSelectedCells,
      setFocusedCellId,
      selectedCells,
    ],
  )

  return { handleGridContextMenu }
}
