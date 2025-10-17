import { TableRow } from '@shared/containers'
import { buildVersionRow, buildProductRow, VersionsMap, ProductsMap } from '../util'
import { useMemo } from 'react'

type Props = {
  rootVersionsMap: VersionsMap
  childVersionsMap: VersionsMap
  productsMap: ProductsMap
  showProducts: boolean
}

export const useBuildVersionsTableData = ({
  rootVersionsMap,
  childVersionsMap,
  productsMap,
  showProducts,
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
        const subRows = childrenByProductId.get(product.id) || []
        result.push(buildProductRow(product, subRows))
      }

      return result
    } else {
      // build flat data using only versionsMap
      return Array.from(rootVersionsMap.values()).map((version) => buildVersionRow(version))
    }
  }, [rootVersionsMap, childVersionsMap, productsMap, showProducts])
}
