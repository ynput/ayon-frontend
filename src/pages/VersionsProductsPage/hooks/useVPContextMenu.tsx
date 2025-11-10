import { useCallback } from 'react'
import {
  useProjectDataContext,
  ContextMenuItemConstructor,
  getCellId,
  ROW_SELECTION_COLUMN_ID,
  useSelectionCellsContext,
  useProjectTableContext,
  getEntityViewierIds,
} from '@shared/containers'
import { useVersionsDataContext } from '../context/VPDataContext'
import { useEntityListsContext } from '@pages/ProjectListsPage/context'
import { confirmDelete } from '@shared/util'
import { useDeleteVersionMutation } from '@shared/api'
import { useDeleteProductMutation } from '@queries/product/updateProduct'
import { useVersionUploadContext } from '@shared/components'

export interface VPContextMenuItems {
  showDetailsItem: ContextMenuItemConstructor
  openViewerItem: ContextMenuItemConstructor
  uploadVersionItem: ContextMenuItemConstructor
  addToListItem: ContextMenuItemConstructor
  productDetailItem: ContextMenuItemConstructor
  versionDetailItem: ContextMenuItemConstructor
  deleteVersionItem: ContextMenuItemConstructor
  deleteProductItem: ContextMenuItemConstructor
}

export const useVPContextMenu = (callbacks?: {
  onOpenProductDetail?: (productIds: string[]) => void
  onOpenVersionDetail?: (versionIds: string[]) => void
}): VPContextMenuItems => {
  const { selectedCells, setSelectedCells, selectCell } = useSelectionCellsContext()
  const { entitiesMap } = useVersionsDataContext()
  const { buildAddToListMenu, buildHierarchicalMenuItems, newListMenuItem, versions, reviews } =
    useEntityListsContext()
  const { onOpenPlayer } = useProjectTableContext()
  const { projectName } = useProjectDataContext()
  const [deleteVersion] = useDeleteVersionMutation()
  const [deleteProduct] = useDeleteProductMutation()
  const { onOpenVersionUpload } = useVersionUploadContext()

  // Shared delete version handler
  const handleDeleteVersion = useCallback(
    async (versionIds: string[], versionNames: string[]) => {
      const isSingle = versionIds.length === 1
      const label = isSingle ? `version ${versionNames[0]}` : `${versionIds.length} versions`

      confirmDelete({
        label,
        accept: async () => {
          // Delete all versions in parallel
          await Promise.all(
            versionIds.map((versionId) => deleteVersion({ versionId, projectName }).unwrap()),
          )
          // Cache invalidation will automatically update the UI
        },
      })
    },
    [deleteVersion, projectName],
  )

  // Shared delete product handler
  const handleDeleteProduct = useCallback(
    async (productIds: string[], productNames: string[]) => {
      const isSingle = productIds.length === 1
      const label = isSingle ? `(${productNames[0]})` : `${productIds.length} products`
      const message = isSingle
        ? `Deleting this product will also delete all associated versions. This action cannot be undone. Are you sure you want to proceed?`
        : `Deleting these ${productIds.length} products will also delete all their associated versions. This action cannot be undone. Are you sure you want to proceed?`

      confirmDelete({
        label,
        message,
        accept: async () => {
          // Delete all products in parallel
          await Promise.all(
            productIds.map((productId) => deleteProduct({ productId, projectName }).unwrap()),
          )
          // Cache invalidation will automatically update the UI
        },
        deleteLabel: isSingle ? 'Delete Product and Versions' : 'Delete Products and Versions',
      })
    },
    [deleteProduct, projectName],
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

  // Upload version context menu item
  const uploadVersionItem: ContextMenuItemConstructor = useCallback(
    (_e: any, cell: any, _selected: any, meta: any) => {
      // Get selected entity IDs from meta, or use the cell entity
      const selectedEntityIds = meta.selectedRows.length > 0 ? meta.selectedRows : [cell.entityId]

      // Only allow single selection for upload
      if (selectedEntityIds.length !== 1) {
        return {
          label: 'Upload version',
          icon: 'upload',
          disabled: true,
        }
      }

      const entityId = selectedEntityIds[0]
      const entity = entitiesMap.get(entityId)
      if (!entity) return undefined

      // Get product ID - either directly from product or from version's product property
      let productId: string | undefined
      if (entity.entityType === 'product') {
        productId = entity.id
      } else if (entity.entityType === 'version' && 'product' in entity) {
        productId = (entity as any).product?.id
      }

      if (!productId) return undefined

      return {
        label: 'Upload version',
        icon: 'upload',
        command: () => onOpenVersionUpload({ productId }),
        hidden: cell.isGroup,
      }
    },
    [entitiesMap, onOpenVersionUpload],
  )

  // Product detail context menu item
  const productDetailItem: ContextMenuItemConstructor = useCallback(
    (_e: any, cell: any, _selected: any, meta: any) => {
      // Get selected entity IDs from meta, or use the cell entity
      const selectedEntityIds = meta.selectedRows.length > 0 ? meta.selectedRows : [cell.entityId]

      // Filter to only product entities
      const productIds: string[] = []

      for (const entityId of selectedEntityIds) {
        const entity = entitiesMap.get(entityId)
        if (entity && entity.entityType === 'product') {
          productIds.push(entity.id)
        }
      }

      // If no products selected, don't show the menu item
      if (productIds.length === 0) {
        return undefined
      }

      return {
        label: 'Product data',
        icon: 'database',
        command: () => {
          callbacks?.onOpenProductDetail?.(productIds)
        },
        hidden: cell.isGroup,
      }
    },
    [entitiesMap, callbacks],
  )

  // Version detail context menu item
  const versionDetailItem: ContextMenuItemConstructor = useCallback(
    (_e: any, cell: any, _selected: any, meta: any) => {
      // Get selected entity IDs from meta, or use the cell entity
      const selectedEntityIds = meta.selectedRows.length > 0 ? meta.selectedRows : [cell.entityId]

      // Filter to only version entities
      const versionIds: string[] = []

      for (const entityId of selectedEntityIds) {
        const entity = entitiesMap.get(entityId)
        if (entity && entity.entityType === 'version') {
          versionIds.push(entity.id)
        }
      }

      // If no versions selected, don't show the menu item
      if (versionIds.length === 0) {
        return undefined
      }

      return {
        label: 'Version data',
        icon: 'database',
        command: () => {
          callbacks?.onOpenVersionDetail?.(versionIds)
        },
        hidden: cell.isGroup,
      }
    },
    [entitiesMap, callbacks],
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
      // Get selected entity IDs from meta, or use the cell entity
      const selectedEntityIds = meta.selectedRows.length > 0 ? meta.selectedRows : [cell.entityId]

      // Filter to only version entities
      const versionIds: string[] = []
      const versionNames: string[] = []

      for (const entityId of selectedEntityIds) {
        const entity = entitiesMap.get(entityId)
        if (entity && entity.entityType === 'version') {
          versionIds.push(entity.id)
          versionNames.push(entity.name)
        }
      }

      // If no versions selected, don't show the menu item
      if (versionIds.length === 0) {
        return undefined
      }

      const isSingle = versionIds.length === 1
      const label = isSingle
        ? `Delete version (${versionNames[0]})`
        : `Delete ${versionIds.length} versions`

      return {
        label,
        icon: 'delete',
        danger: true,
        command: () => handleDeleteVersion(versionIds, versionNames),
        hidden: cell.columnId !== 'name' || cell.isGroup,
      }
    },
    [entitiesMap, handleDeleteVersion],
  )

  // Delete product context menu item
  const deleteProductItem: ContextMenuItemConstructor = useCallback(
    (_e: any, cell: any, _selected: any, meta: any) => {
      // Get selected entity IDs from meta, or use the cell entity
      const selectedEntityIds = meta.selectedRows.length > 0 ? meta.selectedRows : [cell.entityId]

      // Filter to only product entities
      const productIds: string[] = []
      const productNames: string[] = []

      for (const entityId of selectedEntityIds) {
        const entity = entitiesMap.get(entityId)
        if (entity && entity.entityType === 'product') {
          productIds.push(entity.id)
          productNames.push(entity.name)
        }
      }

      // If no products selected, don't show the menu item
      if (productIds.length === 0) {
        return undefined
      }

      const isSingle = productIds.length === 1
      const label = isSingle
        ? `Delete product (${productNames[0]})`
        : `Delete ${productIds.length} products`

      return {
        label,
        icon: 'delete',
        danger: true,
        command: () => handleDeleteProduct(productIds, productNames),
        hidden: cell.columnId !== 'name' || cell.isGroup,
      }
    },
    [entitiesMap, handleDeleteProduct],
  )

  return {
    showDetailsItem,
    openViewerItem,
    uploadVersionItem,
    addToListItem,
    productDetailItem,
    versionDetailItem,
    deleteVersionItem,
    deleteProductItem,
  }
}
