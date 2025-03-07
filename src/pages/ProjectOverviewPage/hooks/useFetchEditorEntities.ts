import { useGetFolderListQuery } from '@queries/getHierarchy'
import { Filter } from '@ynput/ayon-react-components'
import {
  useGetOverviewTasksByFoldersQuery,
  useGetQueryTasksFoldersQuery,
  useGetTasksListQuery,
} from '@queries/overview/getOverview'
import { FolderNodeMap, TaskNodeMap } from '../../../containers/ProjectTreeTable/utils/types'
import { useMemo, useState } from 'react'
import clientFilterToQueryFilter from '../utils/clientFilterToQueryFilter'
import { ExpandedState } from '@tanstack/react-table'

type Params = {
  projectName: string
  selectedFolders: string[] // folders selected in the slicer (hierarchy)
  filters: Filter[] // filters from the filters bar or slicer (not hierarchy)
  expanded: ExpandedState
  showHierarchy: boolean
}

export type TasksByFolderMap = Map<string, string[]>

type UseFetchEditorEntitiesData = {
  foldersMap: FolderNodeMap
  tasksMap: TaskNodeMap
  tasksByFolderMap: TasksByFolderMap
  isLoading: boolean
  fetchNextPage: () => void
}

const useFetchEditorEntities = ({
  projectName,
  selectedFolders,
  filters,
  expanded,
  showHierarchy,
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
    { skip: !Object.keys(expanded).length || !showHierarchy },
  )

  console.log(expandedFoldersTasks)

  // get folders that would be left if the filters were applied for tasks
  const { data: foldersByTaskFilter, isUninitialized } = useGetQueryTasksFoldersQuery(
    {
      projectName,
      tasksFoldersQuery: { filter: queryFilter },
    },
    {
      skip: !filters.length || !folders.length || !showHierarchy,
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

    // Filter by selected folders if needed
    if (selectedFolders.length) {
      const selectedPaths = selectedFolders
        .map((id) => map.get(id)?.path)
        .filter(Boolean) as string[]

      if (selectedPaths.length) {
        // Create a new map that only contains selected folders and their children
        const filteredMap = new Map()

        // For each folder, check if it should be included
        map.forEach((folder, folderId) => {
          const folderPath = folder.path as string

          // Include if it's a parent or the folder itself
          const folderPathParts = folderPath.split('/')
          let isParentOrSelf = false

          for (let i = 0; i < folderPathParts.length; i++) {
            const partialPath = folderPathParts.slice(0, i + 1).join('/')
            if (selectedPaths.some((p) => p === partialPath)) {
              isParentOrSelf = true
              break
            }
          }

          // Include if it's a child of any selected folder
          const isChild = selectedPaths.some((selectedPath) =>
            folderPath.startsWith(selectedPath + '/'),
          )

          if (isParentOrSelf || isChild) {
            filteredMap.set(folderId, folder)
          }
        })

        return filteredMap
      }
    }

    return map
  }, [folders, foldersByTaskFilter, isUninitialized, selectedFolders])

  const [tasksListCursor, setTasksListCursor] = useState('')
  // get all tasks if we are viewing flat hierarchy
  const { data: tasksListData, isFetching: isFetchingTaskList } = useGetTasksListQuery(
    {
      projectName,
      filter: filters?.length ? queryFilterString : '',
      folderIds: selectedFolders.length ? Array.from(foldersMap.keys()) : undefined,
      after: tasksListCursor,
    },
    { skip: showHierarchy },
  )

  const tasksList = tasksListData?.tasks || []
  const tasksListPageInfo = tasksListData?.pageInfo

  const handleFetchNextPage = () => {
    if (tasksListPageInfo?.endCursor && tasksListPageInfo.hasNextPage) {
      console.log('fetching next page', tasksListPageInfo.endCursor)
      setTasksListCursor(tasksListPageInfo.endCursor)
    }
  }

  // tasksMaps is a map of tasks by task ID
  // tasksByFolderMap is a map of tasks by folder ID
  const { tasksMap, tasksByFolderMap } = useMemo(() => {
    const tasksMap: TaskNodeMap = new Map()
    const tasksByFolderMap: TasksByFolderMap = new Map()

    // either show the hierarchy or the flat list of tasks
    const allTasks = showHierarchy ? expandedFoldersTasks : tasksList
    for (const task of allTasks) {
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
  }, [expandedFoldersTasks, showHierarchy, tasksList])

  return {
    foldersMap: foldersMap,
    tasksMap: tasksMap,
    tasksByFolderMap: tasksByFolderMap,
    isLoading: isLoading || isFetching || isFetchingTaskList,
    fetchNextPage: handleFetchNextPage,
  }
}

export default useFetchEditorEntities
