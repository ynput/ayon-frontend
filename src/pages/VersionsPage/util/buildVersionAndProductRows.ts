import { ProductNode, VersionNode } from '@shared/api/queries'
import { TableRow } from '@shared/containers'

export const buildProductRow = (product: ProductNode, subRows: TableRow[]): TableRow => ({
  id: product.id,
  name: product.name,
  label: product.name,
  entityId: product.id,
  entityType: 'product',
  createdAt: product.createdAt,
  updatedAt: product.updatedAt,
  status: product.status,
  tags: product.tags,
  folderId: product.folderId,
  parents: product.parents?.slice(0, -1),
  attrib: { ...product.featuredVersion?.attrib, ...product.attrib },
  ownAttrib: Object.keys(product.attrib || {}),
  subType: product.productType,
  thumbnail: {
    entityId: product.featuredVersion?.id || product.id,
    entityType: product.featuredVersion ? 'version' : 'product',
    updatedAt: product.featuredVersion?.updatedAt || product.updatedAt,
  },
  subRows,
  links: {}, // TODO add links
})

export const buildVersionRow = (
  version: VersionNode,
  subRows?: TableRow[] | undefined,
): TableRow => ({
  id: version.id,
  name: version.name,
  label: `${version.product.name} - ${version.name}`,
  entityId: version.id,
  entityType: 'version',
  createdAt: version.createdAt,
  updatedAt: version.updatedAt,
  status: version.status,
  tags: version.tags,
  parents: version.parents?.slice(0, -1),
  attrib: version.attrib,
  ownAttrib: Object.keys(version.attrib || {}),
  subType: version.product.productType,
  hasReviewables: version.hasReviewables,
  // @ts-expect-error - it actually can be undefined
  subRows,
  links: {}, // TODO add links
})
