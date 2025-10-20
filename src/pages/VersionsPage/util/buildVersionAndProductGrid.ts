// transforms data for the grid tiles

import { VersionBaseFragment } from '@shared/api'
import { ProductsMap, VersionsMap } from './buildVersionsAndProductsMap'
import { getEntityTypeIcon, productTypes } from '@shared/util'

type EntityGridNode = {
  id: string
  entityType: 'product' | 'version'
  header: string
  path: string // shows on hover
  title: string // top left
  icon: string // product type icon
  status: string
  author?: string | null
  isPlayable: boolean
  thumbnailUrl: string | undefined
  versions?: string[]
}

const getThumbnailUrl = (projectName: string, entity: VersionBaseFragment) =>
  `/api/projects/${projectName}/versions/${entity.id}/thumbnail?updatedAt=${entity.updatedAt}`

const buildProductsGrid = (productsMap: ProductsMap, projectName: string): EntityGridNode[] => {
  return Array.from(productsMap.values()).map((product) => {
    const productType = productTypes[product.productType]
    const featuredVersion = product.featuredVersion?.name

    return {
      id: product.id,
      entityType: 'product',
      header: product.parents[product.parents.length - 1],
      path: product.parents.slice(0, -1).join(' / '),
      title: product.name,
      icon: productType?.icon || getEntityTypeIcon('product'),
      status: product.status,
      versions: product.versions
        .map((v) => v.name)
        .sort((a, b) => {
          // does it match featured version?
          if (a === featuredVersion) return 1
          if (b === featuredVersion) return -1
          return 0
        }),
      isPlayable: false,
      thumbnailUrl: product.featuredVersion
        ? getThumbnailUrl(projectName, product.featuredVersion)
        : undefined,
    }
  })
}

const buildVersionsGrid = (versionsMap: VersionsMap, projectName: string): EntityGridNode[] => {
  return Array.from(versionsMap.values()).map((version) => {
    return {
      id: version.id,
      entityType: 'version',
      header: version.product.name,
      path: version.parents.slice(0, -1).join('/'),
      title: version.name,
      icon: getEntityTypeIcon('version'),
      status: version.status,
      author: version.author || null,
      isPlayable: version.hasReviewables,
      thumbnailUrl: getThumbnailUrl(projectName, version),
    }
  })
}

type Props = {
  productsMap: ProductsMap
  versionsMap: VersionsMap
  showProducts: boolean
  projectName: string
}

export const buildVersionAndProductGrid = ({
  productsMap,
  versionsMap,
  showProducts,
  projectName,
}: Props) => {
  if (showProducts) {
    return buildProductsGrid(productsMap, projectName)
  } else {
    return buildVersionsGrid(versionsMap, projectName)
  }
}
