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

  // Step 2: Optimistically patch getProductsInfinite cache
  for (const entry of productEntries) {
    if (entry.endpointName === 'getProductsInfinite') {
      const patch = dispatch(
        injectedVersionsPageApi.util.updateQueryData(
          'getProductsInfinite',
          entry.originalArgs,
          (draft: any) => {
            // Update products across all pages
            for (const page of draft.pages) {
              for (let i = 0; i < page.products.length; i++) {
                const product = page.products[i]
                const operation = products.find((op) => op.entityId === product.id)
                if (operation?.data) {
                  page.products[i] = updateProductWithOperation(product, operation.data)
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
