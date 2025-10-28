import { EntityLink, ProductNode, VersionNode } from '@shared/api/queries'
import { EditorVersionNode } from '@shared/containers'

export type VersionNodeExtended = VersionNode & EditorVersionNode
export type VersionsMap = Map<string, VersionNodeExtended>

export type ProductNodeExtended = ProductNode & {
  id: string
  entityId: string
  entityType: 'product'
  folderId: string
  label?: string | null
  name: string
  ownAttrib: Array<string>
  status: string
  tags: Array<string>
  taskType: string
  updatedAt: any
  createdAt?: string
  active: boolean
  assignees: Array<string>
  allAttrib: string
  attrib?: Record<string, any>
  links: EntityLink[]
}
export type ProductsMap = Map<string, ProductNodeExtended>

/**
 * Transforms a ProductNode to ProductNodeExtended.
 * @param product The ProductNode to transform
 * @returns ProductNodeExtended with all required fields
 */
export function productNodeToExtended(product: ProductNode): ProductNodeExtended {
  return {
    ...product, // include all original fields
    id: product.id,
    entityId: product.id,
    entityType: 'product',
    folderId: product.folderId || '',
    label: product.name,
    name: product.name,
    ownAttrib: Object.keys(product.attrib || {}),
    status: product.status || '',
    tags: product.tags || [],
    taskType: '', // not applicable
    updatedAt: product.updatedAt,
    createdAt: product.createdAt || '',
    active: product.active || false,
    assignees: [], // not applicable
    allAttrib: product.allAttrib,
    attrib: product.attrib || {},
    links: [], // not applicable right now
  }
}

/**
 * Transforms a VersionNode to EditorVersionNode.
 * @param version The VersionNode to transform
 * @returns EditorVersionNode with all required fields
 */
export function versionNodeToEditorVersionNode(version: VersionNode): VersionNodeExtended {
  return {
    ...version, // include all original fields
    id: version.id,
    entityId: version.id,
    entityType: 'version',
    folderId: '',
    label: version.name,
    name: version.name,
    ownAttrib: [], // not applicable
    status: version.status || '',
    tags: version.tags || [],
    taskType: '', // not applicable
    updatedAt: version.updatedAt,
    createdAt: version.createdAt || '',
    active: version.active || false,
    assignees: [], // not applicable
    allAttrib: version.allAttrib,
    attrib: version.attrib || {},
    product: version.product,
    links: [], // not applicable right now
    groups: version.groups,
  }
}

/**
 * Efficiently builds all version and product maps from version and product lists.
 * @param versions Root version nodes
 * @param childVersions Child version nodes
 * @param products Product nodes
 * @returns Object containing versionsMap, childVersionsMap, allVersionsMap, productsMap, and entitiesMap
 */
export function buildVersionsAndProductsMaps(
  versions: VersionNode[],
  childVersions: VersionNode[],
  products: ProductNode[],
  groupedVersions: VersionNode[] = [],
) {
  const versionsMap = new Map<string, VersionNodeExtended>()
  const childVersionsMap = new Map<string, VersionNodeExtended>()
  const groupedVersionsMap = new Map<string, VersionNodeExtended>()
  const allVersionsMap = new Map<string, VersionNodeExtended>()
  const productsMap = new Map<string, ProductNodeExtended>()
  const entitiesMap = new Map<string, VersionNodeExtended | ProductNodeExtended>()

  // Process root versions
  for (let i = 0, len = versions.length; i < len; ++i) {
    const v = versions[i]
    const editorVersion = versionNodeToEditorVersionNode(v)
    versionsMap.set(v.id, editorVersion)
    allVersionsMap.set(v.id, editorVersion)
    entitiesMap.set(v.id, editorVersion)
  }

  // Process child versions
  for (let i = 0, len = childVersions.length; i < len; ++i) {
    const v = childVersions[i]
    const editorVersion = versionNodeToEditorVersionNode(v)
    childVersionsMap.set(v.id, editorVersion)
    allVersionsMap.set(v.id, editorVersion)
    entitiesMap.set(v.id, editorVersion)
  }

  // process grouped versions
  for (let i = 0, len = groupedVersions.length; i < len; ++i) {
    const v = groupedVersions[i]
    const editorVersion = versionNodeToEditorVersionNode(v)
    groupedVersionsMap.set(v.id, editorVersion)
    allVersionsMap.set(v.id, editorVersion)
    entitiesMap.set(v.id, editorVersion)
  }

  // Process products
  for (let i = 0, len = products.length; i < len; ++i) {
    const p = products[i]
    const extendedProduct = productNodeToExtended(p)
    productsMap.set(p.id, extendedProduct)
    entitiesMap.set(p.id, extendedProduct)
  }

  return {
    versionsMap,
    childVersionsMap,
    groupedVersionsMap,
    allVersionsMap,
    productsMap,
    entitiesMap,
  }
}
