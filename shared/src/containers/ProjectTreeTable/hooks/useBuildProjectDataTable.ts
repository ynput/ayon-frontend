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
import { buildFolderTableRow, buildTaskTableRow, linksToTableData } from '../utils'
import { useProjectContext } from '@shared/context'

type Params = {
  foldersMap: FolderNodeMap
  tasksMap: TaskNodeMap
  tasksByFolderMap: TasksByFolderMap
  rows?: TableRow[]
  expanded: ExpandedState
  showHierarchy: boolean
  isFlatFolderView?: boolean
  showEmptyFolders?: boolean
  loadingTasks?: LoadingTasks
  isLoadingMore?: boolean
  groupBy?: TableGroupBy
  selectedFolders?: string[]
}

export default function useBuildProjectDataTable({
  foldersMap,
  tasksMap,
  rows,
  tasksByFolderMap,
  expanded,
  showHierarchy,
  isFlatFolderView = false,
  showEmptyFolders = false,
  loadingTasks = {},
  isLoadingMore = false,
  selectedFolders = [],
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
      const row = buildTaskTableRow(task, foldersMap.get(parentId || task.folderId))
      row.primary.icon = typeData?.icon || null
      row.primary.color = typeData?.color || null
      row.primary.links = linksToTableData(task.links, 'task', project.anatomy)
      row.subRows = []
      return row
    }

    const createFolderRow = (
      folder: typeof foldersMap extends Map<string, infer T> ? T : never,
    ) => {
      const typeData = getEntityTypeData('folder', folder.folderType)
      const row = buildFolderTableRow(folder)
      row.primary.icon = typeData?.icon || null
      row.primary.color = typeData?.color || null
      row.primary.links = linksToTableData(folder.links, 'folder', project.anatomy)
      row.subRows = []
      return row
    }

    const createRootTaskRows = (): TableRow[] => {
      const rootTaskRows: TableRow[] = []
      for (const folderId of selectedFolders) {
        if (foldersMap.has(folderId)) continue
        const folderTaskIds = tasksByFolderMap.get(folderId) || []
        for (const taskId of folderTaskIds) {
          const task = tasksMap.get(taskId)
          if (task) rootTaskRows.push(createTaskRow(task))
        }
      }
      return rootTaskRows
    }

    // Flat folder view: all folders at root level, each expandable to show tasks
    if (isFlatFolderView) {
      const flatFolderRows: TableRow[] = []

      for (const folder of foldersMap.values()) {
        if (!folder?.id) continue

        // Use the folder's hasTasks flag (from REST data) to filter before tasks are loaded
        const hasTasks = folder.hasTasks ?? tasksByFolderMap.has(folder.id)
        // Skip folders without tasks when showEmptyFolders is off
        if (!showEmptyFolders && !hasTasks) continue

        const row = createFolderRow(folder)
        row.childOnlyMatch = folder.childOnlyMatch || false

        // If folder is expanded, attach task subRows
        if (expandedFolderIds.has(folder.id)) {
          const folderTaskIds = tasksByFolderMap.get(folder.id) || []
          const folderTasks = folderTaskIds.flatMap((taskId) => tasksMap.get(taskId) || [])

          if (folderTasks.length || loadingTasks[folder.id]) {
            const taskRows = folderTasks.map((task) => createTaskRow(task, folder.id))

            if (loadingTasks[folder.id]) {
              const count = loadingTasks[folder.id]
              if (count > 0) {
                taskRows.push(...generateLoadingRows(count))
              }
            }

            row.subRows = taskRows
          }
        }

        flatFolderRows.push(row)
      }

      flatFolderRows.push(...createRootTaskRows())

      return flatFolderRows
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
          const loadingTaskRows = generateLoadingRows(count)

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

      const row = createFolderRow(folder)
      row.childOnlyMatch = folder.childOnlyMatch || false

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
              const loadingTaskRows = generateLoadingRows(count)

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

    rootRows.push(...createRootTaskRows())

    // if we are loading more tasks, add loading rows at the root level
    // this happens when in hierarchy mode but with a slicer selection that causes paginated tasks
    if (showHierarchy && isLoadingMore) {
      const count = TASKS_INFINITE_QUERY_COUNT
      if (count > 0) {
        rootRows.push(...generateLoadingRows(count))
      }
    }

    // Add any extra rows to the root rows
    for (const row of rows || []) {
      rootRows.push(row)
    }

    return rootRows
  }, [
    foldersMap,
    tasksMap,
    tasksByFolderMap,
    rows,
    visibleFolders,
    childToParentMap,
    expandedFolderIds,
    showHierarchy,
    isFlatFolderView,
    showEmptyFolders,
    loadingTasks,
    isLoadingMore,
    selectedFolders,
  ])
}
