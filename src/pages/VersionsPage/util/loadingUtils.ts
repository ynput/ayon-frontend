import { ProductMap } from '../context/VersionsDataContext'
import { VersionNode } from '@shared/api/queries/versions/getVersions'

/**
 * Parameters for determineLoadingProductVersions function
 */
export type DetermineLoadingProductVersionsParams = {
  childVersions: VersionNode[]
  expandedProductIds: string[]
  productsMap: ProductMap
  hasFiltersApplied?: boolean
  isLoading?: boolean
}

/**
 * Determines which products are currently loading child versions
 * @param params - Object containing parameters for determining loading products
 * @returns Record of product IDs to the count of versions being loaded
 */
export const determineLoadingProductVersions = ({
  childVersions,
  expandedProductIds,
  productsMap,
  hasFiltersApplied,
  isLoading,
}: DetermineLoadingProductVersionsParams): Record<string, number> => {
  if (!isLoading) {
    return {}
  }

  // Get product IDs that have already loaded versions
  const loadedProductIds = new Set(
    childVersions.map((version) => version.product?.id).filter(Boolean),
  )

  // Find expanded products that have versions but haven't loaded them yet
  const expandedProductIdsThatHaveVersions = expandedProductIds.filter((id) => {
    const product = productsMap.get(id)
    return product && (product.versions?.length ?? 0) > 0
  })

  // Determine which products are still loading
  const loadingProductIds = new Set<string>()
  for (const productId of expandedProductIdsThatHaveVersions) {
    if (!loadedProductIds.has(productId)) {
      loadingProductIds.add(productId)
    }
  }

  // Build the result with version counts
  const loadingProducts: Record<string, number> = {}
  for (const productId of loadingProductIds) {
    const product = productsMap.get(productId)
    if (product && !hasFiltersApplied) {
      loadingProducts[productId] = product.versions?.length ?? 0
    } else {
      // add 1
      loadingProducts[productId] = 1
    }
  }

  return loadingProducts
}
