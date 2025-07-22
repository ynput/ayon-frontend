import { EntityLinkQuery } from '../getEntityLinks'

// Helper function to format entity label based on type
export const formatEntityLabel = (node: any): string | undefined => {
  if (!node) return undefined
  // Use label if available, otherwise fallback to name
  return node.label
}

// Helper function to format entity path based on type
export const formatEntityPath = (node: EntityLinkQuery['node'], entityType: string): string => {
  if (!node) return ''

  // Use __typename to safely access fields
  switch (entityType) {
    case 'task':
      if (node.__typename === 'TaskNode' && node.folder && 'path' in node.folder) {
        return node.folder.path || ''
      }
      return ''
    case 'folder':
      if (node.__typename === 'FolderNode' && 'path' in node) {
        // for folders, remove the last segment as it's the folder itself
        const segments = node.path?.split('/')
        return segments?.slice(0, -1).join('/') || ''
      }
      return ''
    case 'product':
      if (node.__typename === 'ProductNode' && node.folder && 'path' in node.folder) {
        return node.folder.path || ''
      }
      return ''
    case 'version':
      if (
        node.__typename === 'VersionNode' &&
        node.product &&
        node.product.folder &&
        'path' in node.product.folder &&
        'name' in node.product
      ) {
        return node.product.folder.path ? `${node.product.folder.path}/${node.product.name}` : ''
      }
      return ''
    case 'representation':
      if (
        node.__typename === 'RepresentationNode' &&
        node.version &&
        node.version.product &&
        node.version.product.folder &&
        'path' in node.version.product.folder &&
        'name' in node.version.product &&
        'name' in node.version
      ) {
        return node.version.product.folder.path
          ? `${node.version.product.folder.path}/${node.version.product.name}/${node.version.name}`
          : ''
      }
      return ''
    case 'workfile':
      if (
        node.__typename === 'WorkfileNode' &&
        node.task &&
        node.task.folder &&
        'path' in node.task.folder &&
        'name' in node.task
      ) {
        return node.task.folder.path ? `${node.task.folder.path}/${node.task.name}` : ''
      }
      return ''
    default:
      return ''
  }
}
