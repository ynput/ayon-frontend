import { useMemo } from 'react'
import {
  EditorTaskNode,
  FolderNodeMap,
  TableRow,
  TaskNodeMap,
  TasksByFolderMap,
} from '../types/table'
import { ExpandedState } from '@tanstack/react-table'
import { generateLoadingRows } from '../utils/loadingUtils'
const TASKS_INFINITE_QUERY_COUNT = 100
import { LoadingTasks } from '../types'
import { FolderType, TaskType } from '../types/project'

type Params = {
  foldersMap: FolderNodeMap
  tasksMap: TaskNodeMap
  tasksByFolderMap: TasksByFolderMap
  expanded: ExpandedState
  folderTypes?: FolderType[]
  taskTypes?: TaskType[]
  showHierarchy: boolean
  loadingTasks: LoadingTasks
  isLoadingMore?: boolean
}

/**
 * React hook that creates a hierarchical tree structure from folders and tasks for use with TanStack Table
 * Uses memoization to avoid unnecessary recalculations on re-render
 *
 * @param foldersMap - Map of folders organized by folder ID
 * @param tasksMap - Map of tasks organized by task ID
 * @param tasksByFolderMap - Map of tasks organized by folder ID
 * @param expanded - Object with folder IDs as keys to indicate expanded folders
 * @param folderTypes - Array of folder types for to add things like folder icon
 * @param taskTypes - Array of task types for to add things like task icon
 * @param showHierarchy - Boolean to indicate if the hierarchy should be shown
 * @param loadingTasks - Object with folder IDs as keys to indicate loading tasks
 * @param isLoadingMore - Boolean to indicate if more tasks are being loaded
 * @returns An array of TableRow objects with nested subRows suitable for TanStack Table
 */
export default function useOverviewTable({
  foldersMap,
  tasksMap,
  tasksByFolderMap,
  expanded,
  folderTypes = [],
  taskTypes = [],
  showHierarchy,
  loadingTasks = {},
  isLoadingMore = false,
}: Params): TableRow[] {
  // create a map of folder types by name for efficient lookups
  const folderTypesByName = useMemo(() => {
    const map: Map<string, FolderType> = new Map()
    for (const folderType of folderTypes) {
      map.set(folderType.name, folderType)
    }
    return map
  }, [folderTypes])

  // create a map of task types by name for efficient lookups
  const taskTypesByName = useMemo(() => {
    const map: Map<string, TaskType> = new Map()
    for (const taskType of taskTypes) {
      map.set(taskType.name, taskType)
    }
    return map
  }, [taskTypes])

  // Convert expanded object to a stable string for memoization comparison
  const expandedKey = useMemo(() => JSON.stringify(expanded), [expanded])

  // Memoize expandedFolderIds set for efficient lookups
  const expandedFolderIds = useMemo(() => {
    return new Set(
      Object.entries(expanded)
        .filter(([_, isExpanded]) => isExpanded)
        .map(([id]) => id),
    )
  }, [expandedKey])

  // Memoize relationship maps to avoid rebuilding them on every render
  const { childToParentMap, parentToChildrenMap } = useMemo(() => {
    const childToParent = new Map<string, string>()
    const parentToChildren = new Map<string, Set<string>>()

    // Construct relationship maps in a single pass
    for (const folder of foldersMap.values()) {
      if (!folder.id) continue

      const parentId = folder.parentId
      if (parentId) {
        childToParent.set(folder.id, parentId)

        let children = parentToChildren.get(parentId)
        if (!children) {
          children = new Set<string>()
          parentToChildren.set(parentId, children)
        }
        children.add(folder.id)
      }
    }

    return { childToParentMap: childToParent, parentToChildrenMap: parentToChildren }
  }, [foldersMap])

  // Memoize visible folders calculation
  const visibleFolders = useMemo(() => {
    const visible = new Set<string>()

    // Start with root folders and folders with non-existent parents
    const queue: string[] = []
    for (const folder of foldersMap.values()) {
      if (!folder.id) continue

      // Include folders with no parent OR with a parent that doesn't exist
      if (!folder.parentId || !foldersMap.has(folder.parentId)) {
        visible.add(folder.id)
        queue.push(folder.id)
      }
    }

    // Process queue to identify visible folders (BFS)
    while (queue.length > 0) {
      const folderId = queue.shift()!
      const isParentExpanded = expandedFolderIds.has(folderId)

      if (!isParentExpanded) continue

      // Add children of expanded folders to visible set
      const childrenIds = parentToChildrenMap.get(folderId)
      if (childrenIds) {
        for (const childId of childrenIds) {
          if (!visible.has(childId)) {
            visible.add(childId)
            queue.push(childId)
          }
        }
      }
    }

    return visible
  }, [foldersMap, parentToChildrenMap, expandedFolderIds])

  // Final memoized result - build the table tree
  return useMemo(() => {
    // Helper function to create a task row
    const createTaskRow = (task: EditorTaskNode, parentId?: string): TableRow => {
      return {
        id: task.id,
        entityType: 'task',
        parentId: parentId || task.folderId,
        name: task.name || '',
        label: task.label || task.name || '',
        icon: taskTypesByName.get(task.taskType)?.icon || null,
        color: taskTypesByName.get(task.taskType)?.color || null,
        status: task.status,
        assignees: task.assignees,
        tags: task.tags,
        img: null,
        subRows: [],
        subType: task.taskType || null,
        attrib: task.attrib,
        ownAttrib: task.ownAttrib,
        path: task.folder.path,
      }
    }

    // If showHierarchy is false, create a flat list of task rows
    if (!showHierarchy) {
      const flatTaskRows: TableRow[] = []

      // Loop through all tasks
      for (const task of tasksMap.values()) {
        if (!task.id) continue
        flatTaskRows.push(createTaskRow(task))
      }

      // Sort all tasks by name
      if (flatTaskRows.length > 1) {
        flatTaskRows.sort((a, b) => {
          if (a.name < b.name) return -1
          if (a.name > b.name) return 1
          return 0
        })
      }

      // if we are loading more tasks, add loading rows
      if (isLoadingMore) {
        const firstTaskAttrib = tasksMap.entries().next()?.value?.[1]?.attrib || {}
        const loadingAttribs = Object.keys(firstTaskAttrib).map((key) => ({
          name: key,
        }))
        // number of tasks we loading with the infinite query
        const count = TASKS_INFINITE_QUERY_COUNT
        if (count > 0) {
          const loadingTaskRows = generateLoadingRows(loadingAttribs, count, {
            type: 'task',
          })

          flatTaskRows.push(...loadingTaskRows)
        }
      }

      return flatTaskRows
    }

    // Use Map for O(1) lookups
    const rowsById = new Map<string, TableRow>()
    const rootRows: TableRow[] = []

    // Create minimal rows for only visible folders
    for (const folderId of visibleFolders) {
      const folder = foldersMap.get(folderId)
      if (!folder) continue

      // Create row with minimal required properties
      const row: TableRow = {
        id: folderId,
        entityType: 'folder',
        parentId: folder.parentId || undefined,
        name: folder.name || '',
        label: folder.label || folder.name || '',
        icon: folderTypesByName.get(folder.folderType)?.icon || null,
        color: null,
        img: null,
        subRows: [],
        status: folder.status,
        tags: folder.tags || [],
        subType: folder.folderType || null,
        ownAttrib: folder.ownAttrib || [],
        path: folder.path,
        attrib: folder.attrib || {},
        childOnlyMatch: folder.childOnlyMatch || false,
      }

      rowsById.set(folderId, row)

      // Add root rows directly to the rootRows array
      if (!folder.parentId || !foldersMap.has(folder.parentId)) {
        rootRows.push(row)
      }

      // Process tasks immediately if folder is expanded
      if (expandedFolderIds.has(folderId)) {
        // because tasksByFolderMap is a map of tasks by folder ID
        // we can directly get the tasks for the current folder
        const folderTaskIds = tasksByFolderMap.get(folderId) || []
        const folderTasks = folderTaskIds.flatMap((taskId) => tasksMap.get(taskId) || [])

        if (folderTasks.length || loadingTasks[folderId]) {
          // Use array literal with known length for better performance
          const taskRows = new Array<TableRow>(folderTasks.length)

          // Direct array assignment is faster than push operations
          for (let i = 0; i < folderTasks.length; i++) {
            taskRows[i] = createTaskRow(folderTasks[i], folderId)
          }

          // Add loading rows if applicable
          if (loadingTasks[folderId]) {
            const firstTaskAttrib = tasksMap.entries().next()?.value?.[1]?.attrib || {}
            const loadingAttribs = Object.keys(firstTaskAttrib).map((key) => ({
              name: key,
            }))
            const count = loadingTasks[folderId]
            if (count > 0) {
              const loadingTaskRows = generateLoadingRows(loadingAttribs, count, {
                type: 'task',
                parentId: folderId,
              })

              taskRows.push(...loadingTaskRows)
            }
          }
          // Only sort if we have multiple items
          if (taskRows.length > 1) {
            // Use a more efficient string comparison for sorting
            taskRows.sort((a, b) => {
              if (a.name < b.name) return -1
              if (a.name > b.name) return 1
              return 0
            })
          }

          row.subRows = taskRows
        }
      }
    }

    // Build the folder hierarchy efficiently
    for (const folderId of visibleFolders) {
      const parentId = childToParentMap.get(folderId)
      if (!parentId || !expandedFolderIds.has(parentId)) continue

      const childRow = rowsById.get(folderId)
      const parentRow = rowsById.get(parentId)

      if (!childRow || !parentRow) continue

      // Add folder to its parent's subRows
      parentRow.subRows.push(childRow)
    }

    // Sort subRows for expanded folders in a single pass
    for (const folderId of expandedFolderIds) {
      const row = rowsById.get(folderId)
      if (!row || row.subRows.length <= 1) continue

      // Process only folders that have both task rows and folder children
      const hasTasksAndFolders =
        row.subRows.some((r) => r.entityType === 'task') &&
        row.subRows.some((r) => r.entityType === 'folder')

      if (hasTasksAndFolders) {
        // More efficient sort using type as primary key to reduce comparisons
        row.subRows.sort((a, b) => {
          // Type first (tasks before folders)
          const typeA = a.entityType === 'task' ? 0 : 1
          const typeB = b.entityType === 'task' ? 0 : 1

          if (typeA !== typeB) return typeA - typeB

          // Then by name using more efficient string comparison
          if (a.name < b.name) return -1
          if (a.name > b.name) return 1
          return 0
        })
      }
    }

    // Sort root rows
    if (rootRows.length > 1) {
      rootRows.sort((a, b) => {
        if (a.name < b.name) return -1
        if (a.name > b.name) return 1
        return 0
      })
    }

    return rootRows
  }, [
    foldersMap,
    tasksMap,
    visibleFolders,
    childToParentMap,
    expandedFolderIds,
    showHierarchy,
    taskTypesByName,
    loadingTasks,
    isLoadingMore,
  ])
}
