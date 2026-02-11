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
import type { VersionNode } from '../versions/getVersionsProducts'

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
  const deleteIds = new Set(
    versions.filter((op) => op.type === 'delete').map((op) => op.entityId),
  )

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

  // Step 3: Invalidate all affected caches to trigger refetching
  // This will automatically refetch with filters and update calculated attributes
  dispatch(injectedVersionsPageApi.util.invalidateTags(tags))
}
