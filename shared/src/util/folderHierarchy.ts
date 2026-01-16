/**
 * Base interface for folder types that can be organized hierarchically
 */
export interface HierarchicalFolder {
  id: string
  parentId?: string | null
}

/**
 * Folder with children array attached
 */
export type FolderWithChildren<T extends HierarchicalFolder> = T & { children: T[] }

/**
 * Result of building a folder hierarchy
 */
export interface FolderHierarchyResult<T extends HierarchicalFolder> {
  folderMap: Map<string, FolderWithChildren<T>>
  rootFolders: FolderWithChildren<T>[]
}

/**
 * Builds a hierarchical folder structure from a flat array of folders.
 * Each folder must have an `id` and optionally a `parentId`.
 *
 * @param folders - Array of folders to organize hierarchically
 * @returns Object containing a map of all folders and array of root folders
 *
 * @example
 * ```ts
 * const folders = [
 *   { id: '1', name: 'Root' },
 *   { id: '2', name: 'Child', parentId: '1' }
 * ]
 * const { folderMap, rootFolders } = buildFolderHierarchy(folders)
 * ```
 */
export const buildFolderHierarchy = <T extends HierarchicalFolder>(
  folders: T[],
): FolderHierarchyResult<T> => {
  const folderMap = new Map<string, FolderWithChildren<T>>()
  const rootFolders: FolderWithChildren<T>[] = []

  // Create nodes for all folders
  for (const folder of folders) {
    folderMap.set(folder.id, { ...folder, children: [] as T[] } as FolderWithChildren<T>)
  }

  // Build parent-child relationships
  for (const folder of folders) {
    const folderNode = folderMap.get(folder.id)!
    if (folder.parentId && folderMap.has(folder.parentId)) {
      folderMap.get(folder.parentId)!.children.push(folderNode)
    } else {
      rootFolders.push(folderNode)
    }
  }

  return { folderMap, rootFolders }
}