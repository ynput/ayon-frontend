/**
 * PATCH VERSIONS - Cache patching for version updates
 *
 * This module handles optimistic updates for version entities and invalidates
 * affected caches to trigger refetching.
 *
 * When versions are updated via operations, this module:
 * 1. Immediately patches caches with operation data (optimistic update)
 * 2. Invalidates affected caches to trigger automatic refetching
 */

import { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit'
import { RootState } from '@reduxjs/toolkit/query'
import { PatchOperation } from './updateOverview'
import { injectedVersionsPageApi } from '../versions/getVersionsProducts'
import type { ProductNode, VersionNode } from '../versions/getVersionsProducts'

// Helper to get version tags for selectInvalidatedBy and invalidation
const getVersionTags = (versions: Pick<PatchOperation, 'entityId'>[]) => {
  return [
    { type: 'version', id: 'LIST' },
    ...versions.map((op) => ({ type: 'version', id: op.entityId })),
  ]
}

// Helper to merge operation data into a version entity
const updateVersionWithOperation = (version: VersionNode, operationData: any): VersionNode => {
  const updated = { ...version } as any

  // Update top-level properties
  Object.keys(operationData).forEach((key) => {
    if (key === 'attrib') return // Handle separately
    if (operationData[key] !== undefined) {
      updated[key] = operationData[key]
    }
  })

  // Handle attrib merging
  if (operationData.attrib) {
    updated.attrib = {
      ...updated.attrib,
      ...operationData.attrib,
    }
  }

  return updated as VersionNode
}

const updateNestedEntityWithOperation = (entity: any, operation: PatchOperation) => {
  if (!operation.data) return

  Object.entries(operation.data).forEach(([key, value]) => {
    if (key === 'attrib') return
    entity[key] = value
  })

  if (operation.data.attrib) {
    entity.attrib = { ...entity.attrib, ...operation.data.attrib }
  }
}

const patchVersionParents = (
  versions: VersionNode[],
  operationsByEntityId: Map<string, PatchOperation>,
) => {
  versions.forEach((version) => {
    const parents = [version.task, version.product, version.product?.folder]
    parents.forEach((parent) => {
      if (!parent) return
      const operation = operationsByEntityId.get(parent.id)
      if (operation) updateNestedEntityWithOperation(parent, operation)
    })
  })
}

const patchProductParents = (
  products: ProductNode[],
  operationsByEntityId: Map<string, PatchOperation>,
) => {
  products.forEach((product) => {
    const folder = product.folder
    if (!folder) return
    const operation = operationsByEntityId.get(folder.id)
    if (operation) updateNestedEntityWithOperation(folder, operation)
  })
}

/**
 * Patches updated task, product, and folder data into nested parent data returned by
 * versions/products queries. Parent entities are not the primary cache entity for these queries,
 * so they need a separate optimistic patch.
 */
export const patchParentEntitiesInVersions = (
  operations: PatchOperation[],
  {
    state,
    dispatch,
  }: {
    state: RootState<any, any, 'restApi'>
    dispatch: ThunkDispatch<any, any, UnknownAction>
  },
  patches?: any[],
) => {
  const operationsByEntityId = new Map(
    operations
      .filter(
        (op) =>
          op.type !== 'delete' &&
          op.entityId &&
          op.data &&
          ['task', 'product', 'folder'].includes(op.entityType),
      )
      .map((op) => [op.entityId as string, op]),
  )
  if (!operationsByEntityId.size) return

  const entries = injectedVersionsPageApi.util.selectInvalidatedBy(state, [
    { type: 'version', id: 'LIST' },
    { type: 'product', id: 'LIST' },
  ])

  for (const entry of entries) {
    if (entry.endpointName === 'getVersionsInfinite') {
      const patch = dispatch(
        injectedVersionsPageApi.util.updateQueryData(
          entry.endpointName,
          entry.originalArgs,
          (draft: any) => {
            for (const page of draft.pages) {
              patchVersionParents(page.versions, operationsByEntityId)
            }
          },
        ),
      )
      patches?.push(patch)
    } else if (entry.endpointName === 'getProductsInfinite') {
      const patch = dispatch(
        injectedVersionsPageApi.util.updateQueryData(
          entry.endpointName,
          entry.originalArgs,
          (draft: any) => {
            for (const page of draft.pages) {
              patchProductParents(page.products, operationsByEntityId)
            }
          },
        ),
      )
      patches?.push(patch)
    } else if (
      entry.endpointName === 'getVersionsByProducts' ||
      entry.endpointName === 'getGroupedVersionsList' ||
      entry.endpointName === 'GetVersions' ||
      entry.endpointName === 'GetVersionsByProductId'
    ) {
      const patch = dispatch(
        injectedVersionsPageApi.util.updateQueryData(
          entry.endpointName,
          entry.originalArgs,
          (draft: any) => patchVersionParents(draft.versions, operationsByEntityId),
        ),
      )
      patches?.push(patch)
    } else if (entry.endpointName === 'GetProducts') {
      const patch = dispatch(
        injectedVersionsPageApi.util.updateQueryData(
          entry.endpointName,
          entry.originalArgs,
          (draft: any) => patchProductParents(draft.products, operationsByEntityId),
        ),
      )
      patches?.push(patch)
    }
  }
}

/**
 * Patches version updates into all relevant caches and invalidates them for refetching:
 * 1. Optimistically update getVersionsInfinite and getVersionsByProducts caches
 * 2. Invalidate all affected caches to trigger automatic refetching
 * 3. For delete operations, invalidate tags immediately
 */
export const patchVersions = (
  versions: PatchOperation[],
  {
    state,
    dispatch,
  }: {
    state: RootState<any, any, 'restApi'>
    dispatch: ThunkDispatch<any, any, UnknownAction>
  },
  patches?: any[],
) => {
  if (!versions.length) return

  const tags = getVersionTags(versions)

  // Step 1: Get caches that need updating using selectInvalidatedBy for version tags
  const versionEntries = injectedVersionsPageApi.util.selectInvalidatedBy(state, tags)

  // Get IDs of versions being deleted
  const deleteIds = new Set(versions.filter((op) => op.type === 'delete').map((op) => op.entityId))

  // Step 2: Optimistically patch caches - handle both updates and deletes
  for (const entry of versionEntries) {
    if (entry.endpointName === 'getVersionsInfinite') {
      const patch = dispatch(
        injectedVersionsPageApi.util.updateQueryData(
          'getVersionsInfinite',
          entry.originalArgs,
          (draft: any) => {
            for (const page of draft.pages) {
              // Remove deleted versions (iterate in reverse to avoid index issues)
              for (let i = page.versions.length - 1; i >= 0; i--) {
                if (deleteIds.has(page.versions[i].id)) {
                  page.versions.splice(i, 1)
                }
              }
              // Update remaining versions
              for (let i = 0; i < page.versions.length; i++) {
                const version = page.versions[i]
                const operation = versions.find(
                  (op) => op.entityId === version.id && op.type !== 'delete',
                )
                if (operation?.data) {
                  page.versions[i] = updateVersionWithOperation(version, operation.data)
                }
              }
            }
          },
        ),
      )
      patches?.push(patch)
    } else if (entry.endpointName === 'getVersionsByProducts') {
      const patch = dispatch(
        injectedVersionsPageApi.util.updateQueryData(
          'getVersionsByProducts',
          entry.originalArgs,
          (draft: any) => {
            // Remove deleted versions (iterate in reverse to avoid index issues)
            for (let i = draft.versions.length - 1; i >= 0; i--) {
              if (deleteIds.has(draft.versions[i].id)) {
                draft.versions.splice(i, 1)
              }
            }
            // Update remaining versions
            for (let i = 0; i < draft.versions.length; i++) {
              const version = draft.versions[i]
              const operation = versions.find(
                (op) => op.entityId === version.id && op.type !== 'delete',
              )
              if (operation?.data) {
                draft.versions[i] = updateVersionWithOperation(version, operation.data)
              }
            }
          },
        ),
      )
      patches?.push(patch)
    } else if (entry.endpointName === 'getProductsInfinite') {
      const patch = dispatch(
        injectedVersionsPageApi.util.updateQueryData(
          'getProductsInfinite',
          entry.originalArgs,
          (draft: any) => {
            for (const page of draft.pages) {
              for (const product of page.products) {
                if (product.featuredVersion) {
                  // If featured version was deleted, set to null
                  if (deleteIds.has(product.featuredVersion.id)) {
                    product.featuredVersion = null
                  } else {
                    // Update featured version if it was updated
                    const operation = versions.find(
                      (op) => op.entityId === product.featuredVersion.id && op.type !== 'delete',
                    )
                    if (operation?.data) {
                      product.featuredVersion = updateVersionWithOperation(
                        product.featuredVersion,
                        operation.data,
                      )
                    }
                  }
                }
              }
            }
          },
        ),
      )
      patches?.push(patch)
    } else if (entry.endpointName === 'getGroupedVersionsList') {
      const patch = dispatch(
        injectedVersionsPageApi.util.updateQueryData(
          'getGroupedVersionsList',
          entry.originalArgs,
          (draft: any) => {
            // Remove deleted versions (iterate in reverse to avoid index issues)
            for (let i = draft.versions.length - 1; i >= 0; i--) {
              if (deleteIds.has(draft.versions[i].id)) {
                draft.versions.splice(i, 1)
              }
            }
            // Update remaining versions
            for (let i = 0; i < draft.versions.length; i++) {
              const version = draft.versions[i]
              const operation = versions.find(
                (op) => op.entityId === version.id && op.type !== 'delete',
              )
              if (operation?.data) {
                // Preserve the groups array (contains pagination state)
                const groups = version.groups
                draft.versions[i] = updateVersionWithOperation(version, operation.data)
                draft.versions[i].groups = groups
              }
            }
          },
        ),
      )
      patches?.push(patch)
    }
  }

  // Invalidate updated rows only; deletes have nothing to refresh — reconciled by invalidatesTags.
  const nonDeleteOps = versions.filter((op) => op.type !== 'delete')
  if (nonDeleteOps.length > 0) {
    dispatch(injectedVersionsPageApi.util.invalidateTags(getVersionTags(nonDeleteOps)))
  }
}
