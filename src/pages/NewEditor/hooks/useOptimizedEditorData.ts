import { TaskNode } from '@api/graphql'
import { FolderListItem } from '@api/rest/folders'
import { Filter } from '@components/SearchFilter/types'
import { TaskFilterValue } from '@containers/TasksProgress/hooks/useFilterBySlice'
import { useGetFolderListQuery } from '@queries/getHierarchy'
import { useGetFilteredEntitiesByParentQuery } from '@queries/overview/getFilteredEntities'
import { useGetTasksFoldersQuery } from '@queries/project/getProject'
import { $Any } from '@types'
import { TableRow } from '../types'

type Params = {
  projectName: string
  folderTypes: $Any
  taskTypes: $Any
  selectedFolders: string[]
  filters: Filter[]
  sliceFilter: TaskFilterValue | null
  expanded: Record<string, boolean>
  showHierarchy: boolean
  entityToRowMappers: $Any
}

export const useOptimizedEditorData = ({
  projectName,
  selectedFolders,
  expanded,
  showHierarchy,
  entityToRowMappers,
}: Params) => {
  // Fetch data
  const { data: { folders = [] } = {}, isLoading } = useGetFolderListQuery(
    { projectName: projectName || '', attrib: true },
    { skip: !projectName },
  )

  const { data: expandedFoldersTasks } = useGetFilteredEntitiesByParentQuery({
    projectName,
    parentIds: Object.keys(expanded),
  })

  const { data: tasksFolders, isLoading: isLoadingTaskFolders } = useGetTasksFoldersQuery({
    projectName,
    query: {
      filter: {
        operator: 'or',
        conditions: [
          {
            operator: 'or',
            conditions: [{ key: 'status', operator: 'eq', value: 'In progress' }],
          },
        ],
      },
    },
  })

  // Early return if loading
  if (isLoading || isLoadingTaskFolders) {
    return { tableData: [], isLoading: true }
  }

  // Optimize data processing
  const processData = () => {
    // Create efficient lookups
    const folderMap = new Map<string, FolderListItem>()
    const expandedFolderTasksMap = new Map<string, TaskNode>()
    const visibleFolders = new Set<string>()

    // Process folders in a single pass
    folders.forEach((folder) => {
      folderMap.set(folder.id, folder)
      if (!folder.parentId || expanded[folder.parentId]) {
        visibleFolders.add(folder.id)
      }
    })

    // Process tasks in a single pass
    if (expandedFoldersTasks?.tasks) {
      Object.entries(expandedFoldersTasks.tasks).forEach(([id, task]) => {
        expandedFolderTasksMap.set(id, task as TaskNode)
      })
    }

    // Filter folders if there are selected folders
    const filteredFolderIds =
      selectedFolders.length > 0
        ? new Set(
            folders
              .filter((folder) =>
                selectedFolders.some((selectedId) =>
                  folder.path.startsWith(folderMap.get(selectedId)?.path || ''),
                ),
              )
              .map((f) => f.id),
          )
        : new Set(folders.map((f) => f.id))

    // Generate table data
    if (!showHierarchy) {
      return createFlatList({
        folders,
        filteredFolderIds,
        expandedFolderTasksMap,
        entityToRowMappers,
      })
    }

    return createHierarchicalList({
      folders,
      visibleFolders,
      filteredFolderIds,
      folderMap,
      expandedFolderTasksMap,
      entityToRowMappers,
      expanded,
    })
  }

  const { tableData } = processData()

  return {
    tableData,
    isLoading: false,
  }
}

const createFlatList = ({
  folders,
  filteredFolderIds,
  expandedFolderTasksMap,
  entityToRowMappers,
}: {
  folders: FolderListItem[]
  filteredFolderIds: Set<string>
  expandedFolderTasksMap: Map<string, TaskNode>
  entityToRowMappers: $Any
}): { tableData: TableRow[] } => {
  // Convert tasks to rows first
  const taskRows = Array.from(expandedFolderTasksMap.values())
    .map((task) => entityToRowMappers.taskToTableRow(task, task.folderId))
    .sort((a, b) => a.name.localeCompare(b.name))

  return {
    tableData: taskRows,
  }
}

const createHierarchicalList = ({
  folders,
  visibleFolders,
  filteredFolderIds,
  folderMap,
  expandedFolderTasksMap,
  entityToRowMappers,
  expanded,
}: {
  folders: FolderListItem[]
  visibleFolders: Set<string>
  filteredFolderIds: Set<string>
  folderMap: Map<string, FolderListItem>
  expandedFolderTasksMap: Map<string, TaskNode>
  entityToRowMappers: $Any
  expanded: Record<string, boolean>
}): { tableData: TableRow[] } => {
  const rootRows: TableRow[] = []
  const childrenMap = new Map<string, TableRow[]>()

  // Process visible and filtered folders in a single pass
  folders
    .filter((folder) => visibleFolders.has(folder.id) && filteredFolderIds.has(folder.id))
    .sort((a, b) => (a.label || a.name).localeCompare(b.label || b.name))
    .forEach((folder) => {
      const row = entityToRowMappers.folderToTableRow(folder)
      row.subRows = []

      // Add tasks if folder is expanded
      if (expanded[folder.id] && folder.hasTasks) {
        const tasks = Array.from(expandedFolderTasksMap.values())
          .filter((task) => task.folderId === folder.id)
          .map((task) => entityToRowMappers.taskToTableRow(task, folder.id))
          .sort((a, b) => a.name.localeCompare(b.name))
        row.subRows.push(...tasks)
      }

      if (folder.parentId) {
        if (!childrenMap.has(folder.parentId)) {
          childrenMap.set(folder.parentId, [])
        }
        childrenMap.get(folder.parentId)!.push(row)
      } else {
        rootRows.push(row)
      }
    })

  // Build hierarchy in a single pass
  childrenMap.forEach((children, parentId) => {
    const parentRow = rootRows.find((row) => row.id === parentId)
    if (parentRow) {
      parentRow.subRows.push(...children)
      parentRow.subRows.sort((a, b) => a.name.localeCompare(b.name))
    }
  })

  return { tableData: rootRows }
}
