/**
 * PATCH PRODUCTS - Cache patching for product updates
 *
 * This module handles optimistic updates for product entities and invalidates
 * affected caches to trigger refetching.
 *
 * When products are updated via operations, this module:
 * 1. Immediately patches caches with operation data (optimistic update)
 * 2. Invalidates affected caches to trigger automatic refetching
 */

import { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit'
import { RootState } from '@reduxjs/toolkit/query'
import { PatchOperation } from './updateOverview'
import { injectedVersionsPageApi } from '../versions/getVersionsProducts'
import type { ProductNode } from '../versions/getVersionsProducts'

// Helper to get product tags for selectInvalidatedBy and invalidation
const getProductTags = (products: Pick<PatchOperation, 'entityId'>[]) => {
  return [
    { type: 'product', id: 'LIST' },
    ...products.map((op) => ({ type: 'product', id: op.entityId })),
  ]
}

// Helper to merge operation data into a product entity
const updateProductWithOperation = (product: ProductNode, operationData: any): ProductNode => {
  const updated = { ...product } as any

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

  return updated as ProductNode
}

/**
 * Patches product updates into all relevant caches and invalidates them for refetching:
 * 1. Optimistically update getProductsInfinite cache
 * 2. Invalidate all affected caches to trigger automatic refetching
 * 3. For delete operations, invalidate tags immediately
 */
export const patchProducts = (
  products: PatchOperation[],
  {
    state,
    dispatch,
  }: {
    state: RootState<any, any, 'restApi'>
    dispatch: ThunkDispatch<any, any, UnknownAction>
  },
  patches?: any[],
) => {
  if (!products.length) return

  const tags = getProductTags(products)

  // Step 1: Get caches that need updating using selectInvalidatedBy for product tags
  const productEntries = injectedVersionsPageApi.util.selectInvalidatedBy(state, tags)

  // Get IDs of products being deleted
  const deleteIds = new Set(products.filter((op) => op.type === 'delete').map((op) => op.entityId))

  // versions of a deleted product are cascade-deleted on the server
  const removeCascadedVersions = (versions: any[]) => {
    for (let i = versions.length - 1; i >= 0; i--) {
      if (deleteIds.has(versions[i].product?.id)) versions.splice(i, 1)
    }
  }

  // Step 2: Optimistically patch caches - handle both updates and deletes
  for (const entry of productEntries) {
    if (entry.endpointName === 'getProductsInfinite') {
      const patch = dispatch(
        injectedVersionsPageApi.util.updateQueryData(
          'getProductsInfinite',
          entry.originalArgs,
          (draft: any) => {
            for (const page of draft.pages) {
              // Remove deleted products (iterate in reverse to avoid index issues)
              for (let i = page.products.length - 1; i >= 0; i--) {
                if (deleteIds.has(page.products[i].id)) {
                  page.products.splice(i, 1)
                }
              }
              // Update remaining products
              for (let i = 0; i < page.products.length; i++) {
                const product = page.products[i]
                const operation = products.find(
                  (op) => op.entityId === product.id && op.type !== 'delete',
                )
                if (operation?.data) {
                  page.products[i] = updateProductWithOperation(product, operation.data)
                }
              }
            }
          },
        ),
      )
      patches?.push(patch)
    } else if (deleteIds.size > 0 && entry.endpointName === 'getVersionsInfinite') {
      const patch = dispatch(
        injectedVersionsPageApi.util.updateQueryData(
          'getVersionsInfinite',
          entry.originalArgs,
          (draft: any) => {
            for (const page of draft.pages) {
              removeCascadedVersions(page.versions)
            }
          },
        ),
      )
      patches?.push(patch)
    } else if (
      deleteIds.size > 0 &&
      (entry.endpointName === 'getVersionsByProducts' ||
        entry.endpointName === 'getGroupedVersionsList')
    ) {
      const patch = dispatch(
        injectedVersionsPageApi.util.updateQueryData(
          entry.endpointName as 'getVersionsByProducts',
          entry.originalArgs,
          (draft: any) => {
            removeCascadedVersions(draft.versions)
          },
        ),
      )
      patches?.push(patch)
    }
  }

  // Invalidate updated rows only; deletes have nothing to refresh — reconciled by invalidatesTags.
  const nonDeleteOps = products.filter((op) => op.type !== 'delete')
  if (nonDeleteOps.length > 0) {
    dispatch(injectedVersionsPageApi.util.invalidateTags(getProductTags(nonDeleteOps)))
  }
}
