import { generateLoadingRows, TableRow } from '@shared/containers'
import { buildVersionRow, buildProductRow, buildEmptyRow, VersionsMap, ProductsMap } from '../util'
import { useMemo } from 'react'
import { VP_INFINITE_QUERY_COUNT } from '@shared/api'

type Props = {
  rootVersionsMap: VersionsMap
  childVersionsMap: VersionsMap
  productsMap: ProductsMap
  showProducts: boolean
  isFetchingNextPage?: boolean
  hasNextPage?: boolean
  loadingProductVersions?: Record<string, number>
}

export const useBuildVersionsTableData = ({
  rootVersionsMap,
  childVersionsMap,
  productsMap,
  showProducts,
  isFetchingNextPage = false,
  hasNextPage = false,
  loadingProductVersions = {},
}: Props): TableRow[] => {
  return useMemo(() => {
    if (showProducts) {
      // Build hierarchical data efficiently using products as root
      const result: TableRow[] = []

      // Group child versions by their product ID (parent) for O(1) lookup
      const childrenByProductId = new Map<string, TableRow[]>()

      for (const childVersion of childVersionsMap.values()) {
        const productId = childVersion.product?.id
        if (!productId) continue

        const childRow = buildVersionRow(childVersion)
        const existing = childrenByProductId.get(productId)
        if (existing) {
          existing.push(childRow)
        } else {
          childrenByProductId.set(productId, [childRow])
        }
      }

      // Build product rows with their version children attached
      for (const product of productsMap.values()) {
        let subRows = childrenByProductId.get(product.id) || []

        // Add loading rows for products that are currently loading versions
        if (loadingProductVersions[product.id]) {
          const loadingCount = loadingProductVersions[product.id]
          const loadingRows = generateLoadingRows(loadingCount)
          subRows = [...subRows, ...loadingRows]
        }

        // Add empty row if product has no versions and no loading versions
        if (subRows.length === 0) {
          subRows = [buildEmptyRow(product.id)]
        }

        result.push(buildProductRow(product, subRows))
      }

      // Add next page loading row if there are more pages
      if (isFetchingNextPage && hasNextPage) {
        result.push(...generateLoadingRows(VP_INFINITE_QUERY_COUNT))
      }

      return result
    } else {
      // build flat data using only versionsMap
      const result = Array.from(rootVersionsMap.values()).map((version) => buildVersionRow(version))

      // Add next page loading row if there are more pages
      if (isFetchingNextPage && hasNextPage) {
        result.push(...generateLoadingRows(VP_INFINITE_QUERY_COUNT))
      }

      return result
    }
  }, [
    rootVersionsMap,
    childVersionsMap,
    productsMap,
    showProducts,
    isFetchingNextPage,
    hasNextPage,
    loadingProductVersions,
  ])
}
