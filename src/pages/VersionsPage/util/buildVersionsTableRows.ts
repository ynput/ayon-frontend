import { SimpleTableRow } from '@shared/containers/SimpleTable'
import { ProductsMap } from './buildVersionsAndProductsMap'
import { getThumbnailUrl } from './buildVersionAndProductGrid'

type Props = {
  projectName: string
  productsMap: ProductsMap
  productIds: string[]
}

export const buildVersionsTableRows = ({
  projectName,
  productsMap,
  productIds,
}: Props): SimpleTableRow[] => {
  return productIds.flatMap((productId, index, array) => {
    const product = productsMap.get(productId)
    if (!product) return []

    return product.versions.map((version) => ({
      id: version.id,
      name: version.name,
      label: version.name,
      img: getThumbnailUrl(projectName, { id: version.id, updatedAt: product.updatedAt }),
      parents:
        array.length > 1
          ? [[...product.parents].pop(), product.name].filter((p): p is string => p !== undefined)
          : undefined,
      data: {
        id: version.id,
      },
      subRows: [],
    }))
  })
}
