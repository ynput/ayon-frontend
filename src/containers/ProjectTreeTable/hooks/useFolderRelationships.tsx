import { useCallback, useMemo } from 'react'
import { EditorTaskNode, FolderNodeMap, MatchingFolder, TaskNodeMap } from '../utils/types'

interface UseFolderRelationshipsProps {
  foldersMap: FolderNodeMap
  tasksMap: TaskNodeMap
  tasksByFolderMap: Map<string, string[]>
}

interface InheritedDependent {
  entityId: string
  entityType: 'task' | 'folder'
  inheritedAttribs: string[]
}

export default function useFolderRelationships({
  foldersMap,
  tasksMap,
  tasksByFolderMap,
}: UseFolderRelationshipsProps) {
  // Pre-compute folder-children relationships
  const folderChildrenMap = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const folder of foldersMap.values()) {
      const parentId = folder.parentId
      if (!parentId) continue

      if (!map.has(parentId)) {
        map.set(parentId, [])
      }
      map.get(parentId)!.push(folder.id)
    }
    return map
  }, [foldersMap])

  const getChildrenEntities = useCallback(
    (id: string) => {
      const descendants: (MatchingFolder | EditorTaskNode)[] = []
      const queue: string[] = [id]
      const visited = new Set<string>()

      while (queue.length > 0) {
        const currentId = queue.shift()!

        if (visited.has(currentId)) continue
        visited.add(currentId)

        // Skip adding the root folder to descendants
        if (currentId !== id) {
          const folder = foldersMap.get(currentId)
          if (folder) descendants.push(folder)
        }

        // Add tasks efficiently with a single lookup
        const taskIds = tasksByFolderMap.get(currentId)
        if (taskIds?.length) {
          for (const taskId of taskIds) {
            const task = tasksMap.get(taskId)
            if (task) descendants.push(task)
          }
        }

        // Add folder children to queue
        const childFolderIds = folderChildrenMap.get(currentId)
        if (childFolderIds?.length) {
          queue.push(...childFolderIds)
        }
      }

      return descendants
    },
    [foldersMap, tasksByFolderMap, tasksMap, folderChildrenMap],
  )

  // Optimized implementation of getInheritedDependents
  const getInheritedDependents = useCallback(
    (entities: { id: string; attribs: string[] }[]) => {
      if (!entities.length) return []

      // Process all entities in one batch for efficiency
      const result: InheritedDependent[] = []

      for (const entity of entities) {
        if (!entity.attribs.length) continue

        const children = getChildrenEntities(entity.id)
        if (!children.length) continue

        for (const child of children) {
          if (!child.ownAttrib) continue

          const inheritedAttribs = entity.attribs.filter(
            (attrib) => !child.ownAttrib.includes(attrib),
          )
          if (inheritedAttribs.length) {
            // Check if entity already exists in the result
            const existingEntityIndex = result.findIndex((item) => item.entityId === child.id)

            if (existingEntityIndex !== -1) {
              // Merge attributes (ensure uniqueness)
              const existingAttribs = result[existingEntityIndex].inheritedAttribs
              const mergedAttribs = [...new Set([...existingAttribs, ...inheritedAttribs])]
              result[existingEntityIndex].inheritedAttribs = mergedAttribs
            } else {
              // Add new entity
              result.push({
                entityId: child.id,
                entityType: 'folderId' in child ? 'task' : 'folder',
                inheritedAttribs,
              })
            }
          }
        }
      }

      return result
    },
    [getChildrenEntities],
  )

  return {
    folderChildrenMap,
    getChildrenEntities,
    getInheritedDependents,
  }
}
