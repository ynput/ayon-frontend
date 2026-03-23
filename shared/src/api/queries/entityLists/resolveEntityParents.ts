import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit'
import { gqlApi } from '@shared/api/generated'

export interface SelectedEntityIds {
  folderIds: string[]
  taskIds: string[]
  versionIds: string[]
  productIds: string[]
}

type AppDispatch = ThunkDispatch<unknown, unknown, UnknownAction>

/**
 * Resolves cross-entity parent references from raw entity IDs.
 * - Tasks → parent folderIds
 * - Versions → parent folderIds and taskIds
 * - Products → parent folderIds
 *
 * Returns a unified SelectedEntityIds where each array contains
 * both direct IDs and resolved parent IDs (deduplicated).
 */
export const resolveEntityParents = async (
  entityIds: SelectedEntityIds,
  projectName: string,
  dispatch: AppDispatch,
): Promise<SelectedEntityIds> => {
  const folderIds = new Set(entityIds.folderIds)
  const taskIds = new Set(entityIds.taskIds)
  const versionIds = new Set(entityIds.versionIds)
  const productIds = new Set(entityIds.productIds)

  const promises: Promise<void>[] = []

  // Tasks → resolve parent folderIds
  // Note: GetTasksList has transformResponse that returns { tasks, pageInfo }
  if (entityIds.taskIds.length) {
    promises.push(
      dispatch(
        gqlApi.endpoints.GetTasksList.initiate({
          projectName,
          taskIds: entityIds.taskIds,
          first: entityIds.taskIds.length,
        }),
      )
        .unwrap()
        .then((result: any) => {
          for (const task of result.tasks) {
            if (task.folderId) {
              folderIds.add(task.folderId)
            }
          }
        }),
    )
  }

  // Versions → resolve parent folderIds, taskIds, and productIds
  // Note: GetVersions has transformResponse that returns { versions, pageInfo }
  if (entityIds.versionIds.length) {
    promises.push(
      dispatch(
        gqlApi.endpoints.GetVersions.initiate({
          projectName,
          versionIds: entityIds.versionIds,
          first: entityIds.versionIds.length,
        }),
      )
        .unwrap()
        .then((result: any) => {
          for (const version of result.versions) {
            if (version.task?.id) {
              taskIds.add(version.task.id)
            }
            if (version.product?.id) {
              productIds.add(version.product.id)
            }
            if (version.product?.folder?.id) {
              folderIds.add(version.product.folder.id)
            }
          }
        }),
    )
  }

  // Products → resolve parent folderIds
  // Note: GetProducts has transformResponse that returns { products, pageInfo }
  if (entityIds.productIds.length) {
    promises.push(
      dispatch(
        gqlApi.endpoints.GetProducts.initiate({
          projectName,
          productIds: entityIds.productIds,
          first: entityIds.productIds.length,
        }),
      )
        .unwrap()
        .then((result: any) => {
          for (const product of result.products) {
            if (product.folderId) {
              folderIds.add(product.folderId)
            }
          }
        }),
    )
  }

  await Promise.all(promises)

  return {
    folderIds: [...folderIds],
    taskIds: [...taskIds],
    versionIds: [...versionIds],
    productIds: [...productIds],
  }
}