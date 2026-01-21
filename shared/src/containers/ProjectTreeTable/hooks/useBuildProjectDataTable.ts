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
import { useGetEntityTypeData } from './useGetEntityTypeData'
import { TableGroupBy } from '../context'
import { linksToTableData } from '../utils'
import { ProjectModelWithProducts, useProjectContext } from '@shared/context'

type Params = {
  foldersMap: FolderNodeMap
  tasksMap: TaskNodeMap
  tasksByFolderMap: TasksByFolderMap
  rows?: TableRow[]
  expanded: ExpandedState
  showHierarchy: boolean
  loadingTasks?: LoadingTasks
  isLoadingMore?: boolean
  groupBy?: TableGroupBy
}

export default function useBuildProjectDataTable({
  foldersMap,
  tasksMap,
  rows,
  tasksByFolderMap,
  expanded,
  showHierarchy,
  loadingTasks = {},
  isLoadingMore = false,
}: Params): TableRow[] {
  const project = useProjectContext()
  const getEntityTypeData = useGetEntityTypeData({ projectInfo: project })

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
      if (!folder?.id) continue

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
      if (!folder?.id) continue

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
      const typeData = getEntityTypeData('task', task.taskType)

      const links = linksToTableData(task.links, 'task', {
        folderTypes: project?.folderTypes || [],
        productTypes: project.productTypes || [],
        taskTypes: project?.taskTypes || [],
      })

      return {
        id: task.id,
        entityType: 'task',
        parentId: parentId || task.folderId,
        folderId: task.folderId,
        name: task.name || '',
        label: task.label || task.name || '',
        icon: typeData?.icon || null,
        color: typeData?.color || null,
        status: task.status,
        assignees: task.assignees,
        tags: task.tags,
        img: null,
        subRows: [],
        subType: task.taskType || null,
        attrib: task.attrib,
        ownAttrib: task.ownAttrib,
        parents: task.parents || [],
        path: task.parents.join('/') || null, // todo: probably remove this and just use parents
        folder: task.parents[task.parents.length - 1] || undefined,
        updatedAt: task.updatedAt,
        createdAt: task.createdAt,
        hasReviewables: task.hasReviewables || false,
        links: links,
        subtasks: task.subtasks || [],
      }
    }

    // If showHierarchy is false, create a flat list of task rows
    if (!showHierarchy) {
      const flatRows: TableRow[] = []

      // Loop through all tasks
      for (const task of tasksMap.values()) {
        if (!task.id) continue
        flatRows.push(createTaskRow(task))
      }

      // Loop through all extra rows
      for (const row of rows || []) {
        flatRows.push(row)
      }

      // if we are loading more tasks, add loading rows
      if (isLoadingMore) {
        // number of tasks we loading with the infinite query
        const count = TASKS_INFINITE_QUERY_COUNT
        if (count > 0) {
          const loadingTaskRows = generateLoadingRows(count, {
            type: 'task',
          })

          flatRows.push(...loadingTaskRows)
        }
      }

      return flatRows
    }

    // Use Map for O(1) lookups
    const rowsById = new Map<string, TableRow>()
    const rootRows: TableRow[] = []

    // Create minimal rows for only visible folders
    for (const folderId of visibleFolders) {
      const folder = foldersMap.get(folderId)
      if (!folder) continue

      const links = linksToTableData(folder.links, 'folder', {
        folderTypes: project?.folderTypes || [],
        productTypes: project?.productTypes || [],
        taskTypes: project?.taskTypes || [],
      })

      // Create row with minimal required properties
      const row: TableRow = {
        id: folderId,
        entityType: 'folder',
        parentId: folder.parentId || undefined,
        folderId: folderId || null, // root folders have no folderId
        name: folder.name || '',
        label: folder.label || folder.name || '',
        icon: getEntityTypeData('folder', folder.folderType)?.icon || null,
        color: null,
        img: null,
        subRows: [],
        status: folder.status,
        tags: folder.tags || [],
        subType: folder.folderType || null,
        ownAttrib: folder.ownAttrib || [],
        path: folder.path,
        folder: folder.parents[folder.parents.length - 1] || undefined,
        attrib: folder.attrib || {},
        childOnlyMatch: folder.childOnlyMatch || false,
        updatedAt: folder.updatedAt,
        createdAt: folder.createdAt,
        hasReviewables: folder.hasReviewables || false,
        hasVersions: folder.hasVersions || false,
        links: links,
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
            const count = loadingTasks[folderId]
            if (count > 0) {
              const loadingTaskRows = generateLoadingRows(count, { parentId: folderId })

              taskRows.push(...loadingTaskRows)
            }
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
      parentRow.subRows?.push(childRow)
    }

    // Add any extra rows to the root rows
    for (const row of rows || []) {
      rootRows.push(row)
    }

    return rootRows
  }, [
    foldersMap,
    tasksMap,
    rows,
    visibleFolders,
    childToParentMap,
    expandedFolderIds,
    showHierarchy,
    loadingTasks,
    isLoadingMore,
  ])
}
