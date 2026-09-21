import {
  EditorProductNode,
  EditorTaskNode,
  EditorVersionNode,
  MatchingFolder,
  ProductEntityData,
  TableRow,
} from '../types'

export const buildFolderTableRow = (node: MatchingFolder): TableRow => ({
  id: node.id,
  primary: {
    id: node.id,
    entityType: 'folder',
    name: node.name || '',
    label: node.label || node.name || '',
    path: node.path,
    hasReviewables: node.hasReviewables,
    status: node.status,
    tags: node.tags || [],
    createdAt: node.createdAt,
    updatedAt: node.updatedAt,
    thumbnailHash: node.thumbnailHash,
    attrib: node.attrib || {},
    ownAttrib: node.ownAttrib || [],
    subType: node.folderType || '',
    hasTasks: node.hasTasks,
    hasVersions: node.hasVersions,
  },
})

export const buildTaskTableRow = (
  node: EditorTaskNode,
  parentFolder?: MatchingFolder,
): TableRow => ({
  id: node.id,
  primary: {
    id: node.id,
    entityType: 'task',
    name: node.name || '',
    label: node.label || node.name || '',
    path: node.parents?.join('/'),
    hasReviewables: node.hasReviewables,
    status: node.status,
    tags: node.tags || [],
    createdAt: node.createdAt,
    updatedAt: node.updatedAt,
    thumbnailHash: node.thumbnailHash,
    attrib: node.attrib || {},
    ownAttrib: node.ownAttrib || [],
    subType: node.taskType || '',
    assignees: node.assignees || [],
    subtasks: node.subtasks || [],
    latestComments: node.latestComments || [],
  },
  parents: parentFolder ? { folder: buildFolderTableRow(parentFolder).primary } : undefined,
  midnightExclusiveFields: node.data?.schedulerSyncData?.allDay
    ? ['attrib_endDate']
    : undefined,
})

export const buildProductTableRow = (
  node: EditorProductNode,
  parentFolder?: MatchingFolder,
): TableRow => {
  const product = node as EditorProductNode & { productType?: string; productBaseType?: string }
  return {
    id: product.id,
    primary: {
      id: product.id,
      entityType: 'product',
      name: product.name || '',
      label: product.label || product.name || '',
      status: product.status,
      tags: product.tags || [],
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      attrib: product.attrib || {},
      ownAttrib: product.ownAttrib || [],
      subType: product.productType || '',
    },
    parents: parentFolder ? { folder: buildFolderTableRow(parentFolder).primary } : undefined,
  }
}

export const buildVersionTableRow = (
  node: EditorVersionNode & { version?: number; versionName?: string; author?: string },
  parentProduct?: ProductEntityData,
  parentFolder?: MatchingFolder,
): TableRow => ({
  id: node.id,
  primary: {
    id: node.id,
    entityType: 'version',
    name: node.name || '',
    label: node.label || node.name || '',
    status: node.status,
    tags: node.tags || [],
    createdAt: node.createdAt,
    updatedAt: node.updatedAt,
    attrib: node.attrib || {},
    ownAttrib: node.ownAttrib || [],
    version: node.version || 0,
    versionName: node.versionName || node.name || '',
    author: node.author,
  },
  parents: {
    ...(parentProduct ? { product: parentProduct } : {}),
    ...(parentFolder ? { folder: buildFolderTableRow(parentFolder).primary } : {}),
  },
})