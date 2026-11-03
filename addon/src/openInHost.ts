// Open AYON's details panel and viewer from addon code: a component, or a `run` piece.
// The host does the work (`provideHost`), so the addon imports neither panel nor viewer.
import { getHost } from './hostBridge'
import { navigateToEntity } from './entityLinks'
import type { EntityLinkRef } from './entityLinks'

/** What the viewer opens. Set one of `folderId`, `taskId` or `productId`. */
export interface ViewerTarget {
  projectName: string
  /** the viewer shows this folder's versions */
  folderId?: string
  /** the viewer shows this task's versions */
  taskId?: string
  /** the viewer shows this product's versions */
  productId?: string
  /** the product to start on, when the target lists several */
  selectedProductId?: string
  /** the versions to start on; the first one when not set */
  versionIds?: string[]
  /** the reviewables to start on, within the versions */
  reviewableIds?: string[]
  /** the viewer's reduced UI, as the Space key on a table row opens it */
  quickView?: boolean
}

/**
 * Opens AYON's viewer (the player) over the page. Works anywhere, also in `run` and `menu` pieces.
 * Returns `false`, and does nothing, when the target names no folder, task or product, or the host
 * has no viewer (the standalone dev shell).
 */
export const openViewer = (target: ViewerTarget): boolean => {
  const open = getHost().openViewer
  if (!open || !target.projectName || !(target.folderId || target.taskId || target.productId)) {
    return false
  }
  open(target)
  return true
}

/**
 * Opens AYON's details panel for entities of one type in one project. The panel shows next to a
 * `project.page` that sets `detailsPanel: true`, and the entities must be in that page's project.
 * Anywhere else it opens the (first) entity in AYON's own page for it, like `navigateToEntity`.
 * Calling it again shows other entities, e.g. to follow a selection. Works anywhere, also in `run`
 * and `menu` pieces. Returns `false`, and does nothing, for an empty list, a mix of entity types or
 * projects, or a type AYON has no details panel or page for (products, for example).
 */
export const openDetails = (entities: EntityLinkRef | readonly EntityLinkRef[]): boolean => {
  const list = Array.isArray(entities) ? entities : [entities as EntityLinkRef]
  const first = list[0]
  if (
    !first ||
    list.some((e) => e.entityType !== first.entityType || e.projectName !== first.projectName)
  ) {
    return false
  }
  if (getHost().openDetails?.(list)) return true
  return navigateToEntity(first)
}

/** Closes the details panel the page shows (`openDetails`). Does nothing when it isn't open. */
export const closeDetails = (): void => {
  getHost().closeDetails?.()
}
