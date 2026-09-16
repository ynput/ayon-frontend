import { ProductNode, VersionNode } from '@shared/api/queries'
import { createMetaRowId, ProductEntityData, TableRow, VersionEntityData } from '@shared/containers'
import { ProjectContextValue } from '@shared/context'

export const HERO_SYMBOL = '★'

const asString = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined

const buildFolderParentEntity = (folder: ProductNode['folder']) => ({
  id: folder.id,
  entityType: 'folder' as const,
  name: folder.name,
  label: folder.label || folder.name,
  status: folder.status,
  tags: folder.tags || [],
  createdAt: asString(folder.createdAt),
  updatedAt: asString(folder.updatedAt),
  thumbnailHash: folder.thumbnailHash,
  attrib: folder.attrib || {},
  ownAttrib: Object.keys(folder.attrib || {}),
  subType: folder.folderType || '',
})

const buildProductParentEntity = (product: VersionNode['product']): ProductEntityData => ({
  id: product.id,
  entityType: 'product',
  name: product.name,
  label: product.name,
  attrib: product.attrib || {},
  ownAttrib: Object.keys(product.attrib || {}),
  subType: product.productType || '',
  productBaseType: product.productBaseType || '',
})

const buildFeaturedVersionParentEntity = (
  version: NonNullable<ProductNode['featuredVersion']>,
): VersionEntityData => ({
  id: version.id,
  entityType: 'version',
  name: version.name,
  label: version.name,
  status: version.status,
  tags: version.tags || [],
  createdAt: asString(version.createdAt),
  updatedAt: asString(version.updatedAt),
  thumbnailHash: version.thumbnailHash,
  attrib: { ...version.attrib },
  ownAttrib: Object.keys(version.attrib || {}),
  version: version.version,
  versionName: version.name,
  author: version.author || '',
  hasReviewables: version.hasReviewables,
  latestComments: version.latestComments || [],
})

export const buildProductTableRow = (
  product: ProductNode,
  subRows: TableRow[],
  getProductType: ProjectContextValue['getProductType'],
): TableRow => {
  const primary: ProductEntityData = {
    id: product.id,
    entityType: 'product',
    name: product.name,
    label: product.name,
    status: product.status,
    tags: product.tags || [],
    createdAt: asString(product.createdAt),
    updatedAt: asString(product.updatedAt),
    attrib: { ...product.attrib },
    ownAttrib: Object.keys(product.attrib || {}),
    subType: product.productType,
    productBaseType: product.productBaseType || '',
    icon: getProductType(product.productType).icon,
    versionsCount: product.versions.length,
    links: {}, // TODO add links
  }

  return {
    id: product.id,
    primary,
    parents: {
      folder: buildFolderParentEntity(product.folder),
      ...(product.featuredVersion
        ? { version: buildFeaturedVersionParentEntity(product.featuredVersion) }
        : {}),
    },
    subRows,
  }
}

export const buildVersionTableRow = (version: VersionNode): TableRow => ({
  id: version.id,
  primary: {
    id: version.id,
    entityType: 'version',
    name: version.name,
    label: `${version.product.name} - ${version.name} ${version.heroVersionId ? HERO_SYMBOL : ''}`,
    status: version.status,
    tags: version.tags || [],
    createdAt: asString(version.createdAt),
    updatedAt: asString(version.updatedAt),
    thumbnailHash: version.thumbnailHash,
    attrib: { ...version.attrib },
    ownAttrib: Object.keys(version.attrib || {}),
    version: version.version,
    versionName: version.name,
    author: version.author || '',
    hasReviewables: version.hasReviewables,
    latestComments: version.latestComments || [],
    links: {}, // TODO add links
  },
  parents: {
    product: buildProductParentEntity(version.product),
    folder: buildFolderParentEntity(version.product.folder),
    ...(version.task
      ? {
          task: {
            id: version.task.id,
            entityType: 'task' as const,
            name: version.task.name,
            label: version.task.label || version.task.name,
            subType: version.task.taskType,
            status: version.task.status,
            attrib: version.task.attrib || {},
            ownAttrib: version.task.ownAttrib || Object.keys(version.task.attrib || {}),
          },
        }
      : {}),
  },
})

export const buildEmptyTableRow = (productId: string): TableRow => ({
  id: createMetaRowId(productId, 'empty'),
  primary: {
    id: productId,
    entityType: 'product',
    name: 'No versions',
    label: 'No versions',
    subType: '',
  },
  metaType: 'empty',
})

export const buildErrorTableRow = (productId: string, errorMessage: string): TableRow => ({
  id: createMetaRowId(productId, 'error'),
  primary: {
    id: productId,
    entityType: 'product',
    name: 'Error loading versions',
    label: `Error: ${errorMessage}`,
    subType: '',
  },
  metaType: 'error',
})
