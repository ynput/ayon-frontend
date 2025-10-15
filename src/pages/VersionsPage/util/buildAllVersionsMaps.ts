import { VersionNode } from '@shared/api/queries'
import { EditorVersionNode } from '@shared/containers'

export type VersionNodeExtended = VersionNode & EditorVersionNode
export type VersionsMap = Map<string, VersionNodeExtended>

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
    folderId: version.product?.folderId || '',
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
  }
}

/**
 * Efficiently builds rootVersionsMap, childVersionsMap, and versionsMap (all versions together) from two lists.
 * @param versions Root version nodes
 * @param childVersions Child version nodes
 * @returns Object containing all three maps
 */
export function buildAllVersionsMaps(versions: VersionNode[], childVersions: VersionNode[]) {
  const rootMap = new Map<string, VersionNodeExtended>()
  const childMap = new Map<string, VersionNodeExtended>()
  const allMap = new Map<string, VersionNodeExtended>()
  for (let i = 0, len = versions.length; i < len; ++i) {
    const v = versions[i]
    const editorVersion = versionNodeToEditorVersionNode(v)
    rootMap.set(v.id, editorVersion)
    allMap.set(v.id, editorVersion)
  }
  for (let i = 0, len = childVersions.length; i < len; ++i) {
    const v = childVersions[i]
    const editorVersion = versionNodeToEditorVersionNode(v)
    childMap.set(v.id, editorVersion)
    allMap.set(v.id, editorVersion)
  }
  return { rootVersionsMap: rootMap, childVersionsMap: childMap, versionsMap: allMap }
}
