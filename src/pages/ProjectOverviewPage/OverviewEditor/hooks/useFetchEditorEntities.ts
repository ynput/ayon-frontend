import { useGetFolderListQuery } from '@queries/getHierarchy'
import { $Any } from '@types'
import { Filter } from '@ynput/ayon-react-components'
import { TaskFilterValue } from '@containers/TasksProgress/hooks/useFilterBySlice'
// import { mapQueryFilters } from '../mappers/mappers'
// import { useGetTasksFoldersQuery } from '@queries/project/getProject'
import {
  useGetOverviewTasksByFoldersQuery,
  useGetQueryTasksFoldersQuery,
} from '@queries/overview/getOverview'
import { FolderNodeMap, TaskNodeMap } from '../types'
import { useMemo } from 'react'
import clientFilterToQueryFilter from '../utils/clientFilterToQueryFilter'

type Params = {
  projectName: string
  selectedFolders: string[]
  filters: Filter[]
  sliceFilter: TaskFilterValue | null
  expanded: Record<string, boolean>
}

export type TasksByFolderMap = Map<string, string[]>

type UseFetchEditorEntitiesData = {
  foldersMap: FolderNodeMap
  tasksMap: TaskNodeMap
  tasksByFolderMap: TasksByFolderMap
  isLoading: boolean
  selectedPaths: string[]
}

const useFetchEditorEntities = ({
  projectName,
  selectedFolders,
  filters,
  sliceFilter,
  expanded,
}: Params): UseFetchEditorEntitiesData => {
  const {
    data: { folders = [] } = {},
    isLoading,
    isFetching,
  } = useGetFolderListQuery(
    { projectName: projectName || '', attrib: true },
    { skip: !projectName },
  )

  // transform the task bar filters to the query format
  // TODO: filters bar just uses the same schema as the server
  const queryFilter = clientFilterToQueryFilter(filters)
  const queryFilterString = JSON.stringify(queryFilter)

  console.log('Folder count:', folders.length)

  const { data: expandedFoldersTasks = [] } = useGetOverviewTasksByFoldersQuery(
    {
      projectName,
      parentIds: Object.keys(expanded),
      filter: filters?.length ? queryFilterString : undefined,
    },
    { skip: !Object.keys(expanded).length },
  )

  // get folders that would be left if the filters were applied for tasks
  const { data: foldersByTaskFilter, isUninitialized } = useGetQueryTasksFoldersQuery(
    {
      projectName,
      tasksFoldersQuery: { filter: queryFilter },
    },
    {
      skip: !(filters.length && folders.length),
    },
  )

  // create a map of folders by id for efficient lookups
  const foldersMap: FolderNodeMap = useMemo(() => {
    const map = new Map()

    // If we have task filters and folders to filter
    if (!isUninitialized && foldersByTaskFilter && folders.length) {
      // Create a set for efficient lookups of filtered folder IDs
      const relevantFolderIds = new Set<string>()

      // First pass: Add all folders from the task filter
      for (const folderId of foldersByTaskFilter) {
        relevantFolderIds.add(folderId)
      }

      // Create a map of folders by ID for parentId lookups
      const foldersByIdMap = new Map<string, (typeof folders)[0]>()
      for (const folder of folders) {
        foldersByIdMap.set(folder.id as string, folder)
      }

      // Second pass: Add all parent folders of filtered folders
      const addParents = (folderId: string) => {
        const folder = foldersByIdMap.get(folderId)
        if (folder && folder.parentId) {
          relevantFolderIds.add(folder.parentId as string)
          addParents(folder.parentId as string)
        }
      }

      // Process each filtered folder to add its parents
      for (const folderId of foldersByTaskFilter) {
        addParents(folderId)
      }

      // Third pass: Build the final map using only relevant folders
      for (const folder of folders) {
        if (relevantFolderIds.has(folder.id as string)) {
          map.set(folder.id as string, folder)
        }
      }
    } else {
      // No filtering, include all folders
      for (const folder of folders) {
        map.set(folder.id as string, folder)
      }
    }

    return map
  }, [folders, foldersByTaskFilter, isUninitialized])

  // tasksMaps is a map of tasks by task ID
  // tasksByFolderMap is a map of tasks by folder ID
  const { tasksMap, tasksByFolderMap } = useMemo(() => {
    const tasksMap: TaskNodeMap = new Map()
    const tasksByFolderMap: TasksByFolderMap = new Map()

    for (const task of expandedFoldersTasks) {
      const taskId = task.id as string
      const folderId = task.folderId as string

      tasksMap.set(taskId, task)

      if (tasksByFolderMap.has(folderId)) {
        tasksByFolderMap.get(folderId)!.push(taskId)
      } else {
        tasksByFolderMap.set(folderId, [taskId])
      }
    }

    return { tasksMap, tasksByFolderMap }
  }, [expandedFoldersTasks])

  const selectedPaths = useMemo(() => {
    return selectedFolders.map((id) => foldersMap.get(id)?.path!).filter(Boolean) as string[]
  }, [selectedFolders, foldersMap])

  const selectedPathsPrefixed = useMemo(() => {
    return selectedPaths.map((path: string) => '/' + path)
  }, [selectedPaths])

  return {
    foldersMap: foldersMap,
    tasksMap: tasksMap,
    tasksByFolderMap: tasksByFolderMap,
    isLoading: isLoading || isFetching,
    selectedPaths: selectedPathsPrefixed,
  }
}

export default useFetchEditorEntities
