import { TableRow } from '@shared/containers'
import { buildVersionRow, VersionsMap } from '../util'
import { useMemo } from 'react'

type Props = {
  rootVersionsMap: VersionsMap
  childVersionsMap: VersionsMap
  isStacked: boolean
}

export const useBuildVersionsTableData = ({
  rootVersionsMap,
  childVersionsMap,
  isStacked,
}: Props): TableRow[] => {
  return useMemo(() => {
    if (isStacked) {
      // Build hierarchical data efficiently
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

      // Build root rows with their children attached
      for (const rootVersion of rootVersionsMap.values()) {
        const productId = rootVersion.product?.id
        const subRows = productId ? childrenByProductId.get(productId) || [] : []
        result.push(buildVersionRow(rootVersion, subRows))
      }

      return result
    } else {
      // build flat data using only versionsMap
      return Array.from(rootVersionsMap.values()).map((version) => buildVersionRow(version))
    }
  }, [rootVersionsMap, childVersionsMap, isStacked])
}
