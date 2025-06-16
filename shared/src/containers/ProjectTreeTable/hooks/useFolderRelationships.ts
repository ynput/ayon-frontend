import { useCallback, useMemo } from 'react'
import {
  EditorTaskNode,
  EMapResult,
  EntitiesMap,
  FolderNodeMap,
  MatchingFolder,
  TaskNodeMap,
} from '../types/table'
import { ProjectAttribModel2 } from '../types/project'
import { ProjectTableAttribute } from '../types'
import { getEntityDataById } from '../utils/cellUtils'

export interface InheritedDependent {
  entityId: string
  entityType: 'task' | 'folder'
  attrib: Record<string, any> // all attribs that are inherited from the parent and their new value
}
export type GetInheritedDependents = (entities: InheritedDependent[]) => InheritedDependent[]
export type FindInheritedValueFromAncestors = (
  entityId: string,
  entityType: 'folder' | 'task',
  attribName: string,
) => any
export type FindNonInheritedValues = (
  folderId: string,
  attribNames: string[],
) => Record<string, any>
export type GetAncestorsOf = (id: string) => string[]
interface UseFolderRelationshipsProps {
  tasksMap?: TaskNodeMap
  entitiesMap?: EntitiesMap
  tasksByFolderMap?: Map<string, string[]>
  getEntityById: (id: string) => any
  projectAttrib: ProjectAttribModel2 | undefined
  attribFields: ProjectTableAttribute[] | undefined
}

export default function useFolderRelationships({
  tasksMap,
  entitiesMap,
  tasksByFolderMap,
  getEntityById,
  projectAttrib,
  attribFields,
}: UseFolderRelationshipsProps) {
  // Pre-compute folder-children relationships
  const folderChildrenMap = useMemo(() => {
    const map = new Map<string, string[]>()
    if (!entitiesMap) return map
    for (const folder of entitiesMap.values()) {
      // Skip if not a folder
      if (folder.entityType !== 'folder') continue
      const parentId = folder.parentId
      if (!parentId) continue

      if (!map.has(parentId)) {
        map.set(parentId, [])
      }
      map.get(parentId)!.push(folder.id)
    }
    return map
  }, [entitiesMap])

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
        if (currentId !== id && entitiesMap) {
          const folder = getEntityDataById<'folder'>(currentId, entitiesMap)
          if (folder) descendants.push({ ...folder, entityType: 'folder' })
        }

        // Add tasks efficiently with a single lookup
        const taskIds = tasksByFolderMap?.get(currentId)
        if (taskIds?.length && entitiesMap) {
          for (const taskId of taskIds) {
            const task = getEntityDataById<'task'>(taskId, entitiesMap)
            if (task) descendants.push({ ...task, entityType: 'task' })
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
    [entitiesMap, tasksByFolderMap, entitiesMap, folderChildrenMap],
  )

  // Helper function to get ancestors of a folder
  const getAncestorsOf: GetAncestorsOf = useCallback(
    (id) => {
      const ancestors: string[] = []
      let currentId = id

      while (true) {
        const entity = entitiesMap && getEntityDataById<'folder'>(currentId, entitiesMap)
        if (!entity || !entity.parentId) break

        ancestors.push(entity.parentId)
        currentId = entity.parentId
      }

      return ancestors
    },
    [entitiesMap],
  )

  // Helper function to get all folder ancestors of a task
  const getTaskAncestors = useCallback(
    (taskId: string): string[] => {
      const task = tasksMap?.get(taskId) as EMapResult<'task'>
      if (!task || !task.folderId) return []

      // Start with the direct parent folder
      const ancestors = [task.folderId]

      // Add all ancestors of the parent folder
      const folderAncestors = getAncestorsOf(task.folderId)
      ancestors.push(...folderAncestors)

      return ancestors
    },
    [tasksMap, getAncestorsOf],
  )

  // Helper function to find non-inherited values for multiple attributes from ancestors
  const findNonInheritedValues: FindNonInheritedValues = useCallback(
    (folderId, attribNames) => {
      if (!attribNames.length) return {}

      const result: Record<string, any> = {}
      const pendingAttribs = new Set(attribNames)

      // Start with the provided folder and traverse upward
      let currentId = folderId

      // Traverse up the folder hierarchy until we've found values for all attributes
      // or we've reached the root folder
      while (pendingAttribs.size > 0) {
        const folder = getEntityById(currentId)
        if (!folder || !currentId) {
          // use the project attrib
          for (const attribName of pendingAttribs) {
            if (projectAttrib && attribName in projectAttrib) {
              // @ts-ignore
              result[attribName] = projectAttrib[attribName]
              pendingAttribs.delete(attribName)
            }
          }

          // end search
          break
        }

        // Check if this folder has non-inherited values for any of our pending attributes
        for (const attribName of Array.from(pendingAttribs)) {
          if (
            folder.ownAttrib?.includes(attribName) &&
            folder.attrib &&
            attribName in folder.attrib
          ) {
            // Found a non-inherited value, add to result and remove from pending
            result[attribName] = folder.attrib[attribName]
            pendingAttribs.delete(attribName)
          }
        }

        // Move up to the parent folder
        currentId = folder.parentId
      }

      // For any attributes without non-inherited values found, set to null
      for (const attribName of pendingAttribs) {
        result[attribName] = null
      }

      return result
    },
    [getEntityById],
  )

  // Optimized implementation of getInheritedDependents
  const getInheritedDependents: GetInheritedDependents = useCallback(
    (entities) => {
      // console.time('getInheritedDependents') // 40ms - TODO improve this
      if (!entities.length) return []

      // Process all entities in one batch for efficiency
      const result: InheritedDependent[] = []

      // Track attributes that are owned (not inherited) to block inheritance
      const blockedInheritanceMap = new Map<string, Set<string>>()

      for (const entity of entities) {
        // check entity is folder
        if (entity.entityType !== 'folder') continue

        const attribEntries = Object.entries(entity.attrib)
        if (!attribEntries.length) continue

        const children = getChildrenEntities(entity.entityId)

        // filter out children that are in entities as they are already processed
        const filteredChildren = children.filter(
          (child) => !entities.find((e) => e.entityId === child.id),
        )

        if (!filteredChildren.length) continue

        for (const child of filteredChildren) {
          // Find which attributes would be inherited by this child
          const inheritedAttribs = attribEntries.filter(
            ([attribName]) =>
              !child.ownAttrib?.includes(attribName) &&
              attribFields?.find((a) => a.name === attribName)?.data?.inherit,
          )

          // Record attributes that child owns (has its own value for)
          const ownedAttribs = attribEntries.filter(([attribName]) =>
            child.ownAttrib?.includes(attribName),
          )

          // If the child has its own value for some attributes, block inheritance for its descendants
          if (ownedAttribs.length) {
            if (!blockedInheritanceMap.has(child.id)) {
              blockedInheritanceMap.set(child.id, new Set())
            }
            ownedAttribs.forEach(([attribName]) => {
              blockedInheritanceMap.get(child.id)!.add(attribName)
            })
          }

          // Filter out attributes blocked by ancestors
          const filteredInheritedAttribs = inheritedAttribs.filter(([attribName]) => {
            // Get ancestors based on entity type
            const ancestors =
              child.entityType === 'task' ? getTaskAncestors(child.id) : getAncestorsOf(child.id)

            // Check if any ancestor blocks this attribute
            for (const ancestor of ancestors) {
              if (
                blockedInheritanceMap.has(ancestor) &&
                blockedInheritanceMap.get(ancestor)!.has(attribName)
              ) {
                return false
              }
            }
            return true
          })

          if (filteredInheritedAttribs.length) {
            // Check if entity already exists in the result
            const existingEntityIndex = result.findIndex((item) => item.entityId === child.id)

            if (existingEntityIndex !== -1) {
              // Merge attributes with existing entry
              result[existingEntityIndex].attrib = {
                ...result[existingEntityIndex].attrib,
                ...Object.fromEntries(filteredInheritedAttribs),
              }
            } else {
              // Add new entity
              result.push({
                entityId: child.id,
                entityType: child.entityType || ('parentId' in child ? 'folder' : 'task'),
                attrib: Object.fromEntries(filteredInheritedAttribs),
              })
            }
          }
        }
      }

      // console.timeEnd('getInheritedDependents')

      return result
    },
    [getChildrenEntities, tasksMap, getTaskAncestors, getAncestorsOf],
  )

  // Helper function to find the inherited value for an attribute from ancestors
  const findInheritedValueFromAncestors = useCallback<FindInheritedValueFromAncestors>(
    (entityId, entityType, attribName) => {
      const entity = getEntityById(entityId)
      if (!entity) return null

      // For tasks, start with their parent folder
      let currentId = entityType === 'task' ? entity.folderId : entity.parentId

      // Traverse up the folder hierarchy
      while (currentId) {
        const ancestor = getEntityById(currentId)
        if (!ancestor) break

        // If the ancestor has its own value for this attribute, return it
        if (
          ancestor.ownAttrib?.includes(attribName) &&
          ancestor.attrib &&
          attribName in ancestor.attrib
        ) {
          return ancestor.attrib[attribName]
        }

        // Move up to the next parent
        currentId = ancestor.parentId
      }

      // If no ancestor has its own value, return null (will use the default)
      return null
    },
    [getEntityById],
  )

  return {
    folderChildrenMap,
    getChildrenEntities,
    getInheritedDependents,
    findInheritedValueFromAncestors,
    findNonInheritedValues,
    getAncestorsOf,
  }
}
