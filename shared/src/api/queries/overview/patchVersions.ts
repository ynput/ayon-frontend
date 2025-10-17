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
import { injectedVersionsPageApi } from '../versions/getVersions'
import type { VersionNode } from '../versions/getVersions'

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

  // Step 1: Get caches that need updating using selectInvalidatedBy for version tags
  const tags = getVersionTags(versions)
  const versionEntries = injectedVersionsPageApi.util.selectInvalidatedBy(state, tags)

  // Step 2: Optimistically patch getVersionsInfinite and getVersionsByProducts caches
  for (const entry of versionEntries) {
    if (entry.endpointName === 'getVersionsInfinite') {
      const patch = dispatch(
        injectedVersionsPageApi.util.updateQueryData(
          'getVersionsInfinite',
          entry.originalArgs,
          (draft: any) => {
            // Update versions across all pages
            for (const page of draft.pages) {
              for (let i = 0; i < page.versions.length; i++) {
                const version = page.versions[i]
                const operation = versions.find((op) => op.entityId === version.id)
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
            // Update versions in the flat array
            for (let i = 0; i < draft.versions.length; i++) {
              const version = draft.versions[i]
              const operation = versions.find((op) => op.entityId === version.id)
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
            // Update featuredVersion for products whose featured version was updated
            for (const page of draft.pages) {
              for (const product of page.products) {
                if (product.featuredVersion) {
                  const operation = versions.find(
                    (op) => op.entityId === product.featuredVersion.id,
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
