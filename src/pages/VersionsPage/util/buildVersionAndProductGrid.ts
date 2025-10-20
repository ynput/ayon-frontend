// transforms data for the grid tiles

import {
  ProductNodeExtended,
  ProductsMap,
  VersionNodeExtended,
  VersionsMap,
} from './buildVersionsAndProductsMap'
import { getEntityTypeIcon, productTypes } from '@shared/util'

type EntityGridNode = {
  id: string
  header: string
  path: string // shows on hover
  title: string // top left
  icon: string // product type icon
  status: string
  author: string | null
  isPlayable: boolean
  thumbnailUrl: string
}

const getThumbnailUrl = (projectName: string, entity: ProductNodeExtended | VersionNodeExtended) =>
  `/api/projects/${projectName}/${entity.entityType}s/${entity.id}/thumbnail?updatedAt=${entity.updatedAt}`

const buildProductsGrid = (productsMap: ProductsMap, projectName: string): EntityGridNode[] => {
  return Array.from(productsMap.values()).map((product) => {
    const productType = productTypes[product.productType]

    return {
      id: product.id,
      header: product.name,
      path: product.parents.join(' / '),
      title: product.featuredVersion?.name || 'No versions',
      icon: productType?.icon || getEntityTypeIcon('product'),
      status: product.status,
      author: product.featuredVersion?.author || null,
      isPlayable: false,
      thumbnailUrl: getThumbnailUrl(projectName, product),
    }
  })
}

const buildVersionsGrid = (versionsMap: VersionsMap, projectName: string): EntityGridNode[] => {
  return Array.from(versionsMap.values()).map((version) => {
    return {
      id: version.id,
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
