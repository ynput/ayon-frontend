import { useCallback } from 'react'
import {
  ContextMenuItemConstructor,
  getCellId,
  parseCellId,
  parseRowId,
  ROW_SELECTION_COLUMN_ID,
  useSelectionCellsContext,
  useProjectTableContext,
  getEntityViewierIds,
} from '@shared/containers'
import { useVersionsDataContext } from '../context/VPDataContext'
import { useEntityListsContext } from '@pages/ProjectListsPage/context'
import { useVersionUploadContext } from '@shared/components'
import {
  useProjectContext,
  useDeleteEntitiesContext,
  type DeletableEntity,
} from '@shared/context'

// prefer the cell selection; fall back to checkbox/row selection only when no body cells
// are selected, then the clicked cell — so a stray row-selection isn't swept in alongside
// an unrelated cell selection
const resolveSelectedEntityIds = (meta: any, cell: any): string[] => {
  const cellEntityIds = [
    ...new Set(
      ((meta.selectedCells as string[]) || [])
        .map((cellId) => {
          const rowId = parseCellId(cellId)?.rowId
          return rowId ? parseRowId(rowId) : undefined
        })
        .filter((id): id is string => !!id),
    ),
  ]
  if (cellEntityIds.length) return cellEntityIds
  if (meta.selectedRows?.length) return meta.selectedRows
  return [cell.entityId]
}

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
  const { buildReviewContextMenu } = useEntityListsContext()
  const { onOpenPlayer } = useProjectTableContext()
  const { projectName } = useProjectContext()
  const { deleteEntities } = useDeleteEntitiesContext()
  const { onOpenVersionUpload } = useVersionUploadContext()

  // Shared delete version handler — delegates to the standardized delete flow
  const handleDeleteVersion = useCallback(
    (versionIds: string[], versionNames: string[]) => {
      const entities = versionIds.map(
        (id, i): DeletableEntity => ({
          id,
          entityType: 'version',
          name: versionNames[i],
          projectName,
        }),
      )
      deleteEntities(entities)
    },
    [deleteEntities, projectName],
  )

  // Shared delete product handler — delegates to the standardized delete flow
  const handleDeleteProduct = useCallback(
    (productIds: string[], productNames: string[]) => {
      const entities = productIds.map(
        (id, i): DeletableEntity => ({
          id,
          entityType: 'product',
          name: productNames[i],
          projectName,
        }),
      )
      deleteEntities(entities)
    },
    [deleteEntities, projectName],
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

      let productId: string | undefined
      let folderId: string | undefined
      let linkedTask:
        | { id: string; name: string; label?: string | null; taskType: string }
        | undefined
      let latestVersionNumber: number | undefined
      let latestVersionId: string | undefined
      if (entity.entityType === 'product') {
        productId = entity.id
        folderId = entity.folderId
        const versions = (entity as any).versions as { id: string; version: number }[] | undefined
        if (versions?.length) {
          const latest = versions.reduce((a, b) => (a.version > b.version ? a : b))
          latestVersionNumber = latest.version
          latestVersionId = latest.id
          // Look up the latest version in entitiesMap to get its task data
          const latestVersion = entitiesMap.get(latest.id)
          linkedTask = (latestVersion as any)?.task
        }
      } else if (entity.entityType === 'version' && 'product' in entity) {
        productId = (entity as any).product?.id
        folderId = (entity as any).product?.folder?.id
        linkedTask = (entity as any).task
      }

      if (!productId) return undefined

      return {
        label: 'Upload version',
        icon: 'upload',
        command: () =>
          onOpenVersionUpload({
            productId,
            folderId,
            taskId: linkedTask?.id,
            linkedTask,
            latestVersionNumber,
            latestVersionId,
          }),
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

      // Transform to ListEntityInput[], resolving products to their featuredVersion
      const versionEntities: { entityId: string; entityType: string; hasReviewables?: boolean }[] =
        []
      let singleVersionName: string | undefined

      for (const entityId of selectedEntityIds) {
        const entity = entitiesMap.get(entityId)
        if (!entity) continue

        if (entity.entityType === 'version') {
          versionEntities.push({
            entityId: entity.id,
            entityType: 'version',
            hasReviewables: (entity as any).hasReviewables,
          })
          if (versionEntities.length === 1) singleVersionName = entity.name
        } else if (entity.entityType === 'product' && 'featuredVersion' in entity) {
          const product = entity as any
          if (product.featuredVersion?.id) {
            versionEntities.push({
              entityId: product.featuredVersion.id,
              entityType: 'version',
              hasReviewables: product.featuredVersion.hasReviewables,
            })
            if (versionEntities.length === 1) singleVersionName = product.featuredVersion.name
          }
        }
      }

      if (versionEntities.length === 0) {
        return { id: 'add-to-list', label: 'Add to list', icon: 'list', disabled: true, items: [] }
      }

      const label =
        versionEntities.length === 1 && singleVersionName
          ? `Add to list (${singleVersionName})`
          : undefined

      return buildReviewContextMenu('version', versionEntities, label)
    },
    [entitiesMap, buildReviewContextMenu],
  )

  // Delete version context menu item
  const deleteVersionItem: ContextMenuItemConstructor = useCallback(
    (_e: any, cell: any, _selected: any, meta: any) => {
      // prefer cell selection, fall back to row/checkbox selection, then the clicked cell
      const selectedEntityIds = resolveSelectedEntityIds(meta, cell)

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
      // prefer cell selection, fall back to row/checkbox selection, then the clicked cell
      const selectedEntityIds = resolveSelectedEntityIds(meta, cell)

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
