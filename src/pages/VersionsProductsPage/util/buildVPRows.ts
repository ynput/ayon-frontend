import { ProductNode, VersionNode } from '@shared/api/queries'
import { createMetaRowId, TableRow } from '@shared/containers'
import { ProjectContextValue } from '@shared/context'

export const HERO_SYMBOL = '★'

export const buildProductRow = (
  product: ProductNode,
  subRows: TableRow[],
  getProductType: ProjectContextValue['getProductType'],
): TableRow => ({
  id: product.id,
  name: product.name,
  label: product.name,
  icon: getProductType(product.productType).icon,
  entityId: product.id,
  entityType: 'product',
  createdAt: product.createdAt,
  updatedAt: product.updatedAt,
  status: product.status,
  tags: product.tags,
  folderId: product.folderId,
  parents: product.parents,
  folder: product.folder.label || product.folder.name,
  product: product.name,
  attrib: { ...product.attrib },
  ownAttrib: Object.keys(product.attrib || {}),
  subType: product.productType,
  version: product.featuredVersion?.version || null,
  versionsCount: product.versions.length,
  versionName: product.featuredVersion?.name || '',
  author: product.featuredVersion?.author || '',
  thumbnail: {
    entityId: product.featuredVersion?.id || product.id,
    entityType: product.featuredVersion ? 'version' : 'product',
    updatedAt: product.featuredVersion?.updatedAt || product.updatedAt,
  },
  subRows,
  links: {}, // TODO add links
})

export const buildVersionRow = (version: VersionNode): TableRow => ({
  id: version.id,
  name: version.name,
  label: `${version.product.name} - ${version.name} ${version.heroVersionId ? HERO_SYMBOL : ''}`,
  entityId: version.id,
  folderId: version.product.folder.id,
  entityType: 'version',
  createdAt: version.createdAt,
  updatedAt: version.updatedAt,
  version: version.version,
  versionName: version.name,
  status: version.status,
  tags: version.tags,
  parents: version.parents,
  folder: version.product.folder.label || version.product.folder.name,
  product: version.product.name,
  attrib: { ...version.product.attrib, ...version.attrib },
  ownAttrib: Object.keys(version.attrib || {}),
  subType: version.product.productType,
  taskType: version.task?.taskType,
  taskLabel: version.task?.label || version.task?.name,
  hasReviewables: version.hasReviewables,
  author: version.author || '',
  links: {}, // TODO add links
})

export const buildEmptyRow = (productId: string): TableRow => ({
  id: createMetaRowId(productId, 'empty'),
  name: 'No versions',
  label: 'No versions',
  entityId: productId,
  entityType: 'product',
  metaType: 'empty',
})

export const buildErrorRow = (productId: string, errorMessage: string): TableRow => ({
  id: createMetaRowId(productId, 'error'),
  name: 'Error loading versions',
  label: `Error: ${errorMessage}`,
  entityId: productId,
  entityType: 'product',
  metaType: 'error',
})
