import { SimpleTableRow } from '@shared/containers/SimpleTable'
import { ProductsMap } from './buildVPMaps'
import { getThumbnailUrl } from './buildVPGrid'
import { HERO_SYMBOL } from './buildVPRows'

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
  return productIds.flatMap((productId, _index, array) => {
    const product = productsMap.get(productId)
    if (!product) return []

    return product.versions.map((version) => ({
      id: version.id,
      name: version.name,
      label: `${version.name} ${version.heroVersionId ? HERO_SYMBOL : ''}`,
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
