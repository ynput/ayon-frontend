// transforms data for the grid tiles
import { HERO_SYMBOL } from './buildVPRows'
import { ProductsMap, VersionsMap } from './buildVPMaps'
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
  groups?: { value?: string; hasNextPage?: string }[] // grouping metadata
}

export const getThumbnailUrl = (projectName: string, entity: { id: string; updatedAt: string }) =>
  `/api/projects/${projectName}/versions/${entity.id}/thumbnail?updatedAt=${entity?.updatedAt}`

const buildProductsGrid = (productsMap: ProductsMap, projectName: string): EntityGridNode[] => {
  return Array.from(productsMap.values()).map((product) => {
    const productType = productTypes[product.productType]
    const featuredVersion = product.featuredVersion?.name

    return {
      id: product.id,
      entityType: 'product',
      header: product.parents[product.parents.length - 1],
      path: product.parents.slice(0, -1).join('/'),
      title: product.name,
      icon: productType?.icon || getEntityTypeIcon('product'),
      status: product.featuredVersion?.status || 'unknown',
      versions: product.versions
        .toSorted((a, b) => {
          // does it match featured version?
          if (a.name === featuredVersion) return 1
          if (b.name === featuredVersion) return -1
          return 0
        })
        .map((v) => `${v.name} ${v.heroVersionId ? HERO_SYMBOL : ''}`),
      isPlayable: product.featuredVersion?.hasReviewables || false,
      thumbnailUrl: product.featuredVersion
        ? getThumbnailUrl(projectName, product.featuredVersion)
        : undefined,
    }
  })
}

const buildVersionsGrid = (versionsMap: VersionsMap, projectName: string): EntityGridNode[] => {
  return Array.from(versionsMap.values()).map((version) => {
    const productType = productTypes[version.product.productType]

    return {
      id: version.id,
      entityType: 'version',
      header: version.parents[version.parents.length - 2],
      path: version.parents.slice(0, -2).join('/'),
      title: version.product.name,
      icon: productType?.icon || getEntityTypeIcon('product'),
      status: version.status,
      versions: [`${version.name} ${version.heroVersionId ? HERO_SYMBOL : ''}`],
      isPlayable: version.hasReviewables,
      thumbnailUrl: getThumbnailUrl(projectName, version),
      groups: version.groups,
    }
  })
}

type Props = {
  productsMap: ProductsMap
  versionsMap: VersionsMap
  showProducts: boolean
  projectName: string
}

export const buildVPGrid = ({ productsMap, versionsMap, showProducts, projectName }: Props) => {
  if (showProducts) {
    return buildProductsGrid(productsMap, projectName)
  } else {
    return buildVersionsGrid(versionsMap, projectName)
  }
}
