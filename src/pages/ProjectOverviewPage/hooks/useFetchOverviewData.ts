import {
  useGetFolderListQuery,
  useGetOverviewTasksByFoldersQuery,
  useGetQueryTasksFoldersQuery,
  useGetTasksListInfiniteInfiniteQuery,
} from '@shared/api'

import { FolderNodeMap, TaskNodeMap } from '@shared/containers/ProjectTreeTable/types/table'
import { useEffect, useMemo, useState } from 'react'
import { ExpandedState, SortingState } from '@tanstack/react-table'
import { ProjectOverviewContextProps } from '../context/ProjectOverviewContext'
import { determineLoadingTaskFolders } from '@shared/containers/ProjectTreeTable/utils/loadingUtils'
import { LoadingTasks } from '@shared/containers/ProjectTreeTable/types'
import { TasksByFolderMap } from '@shared/containers/ProjectTreeTable/utils'

type useFetchOverviewDataData = {
  foldersMap: FolderNodeMap
  tasksMap: TaskNodeMap
  tasksByFolderMap: TasksByFolderMap
  isLoadingAll: boolean // the whole table is a loading state
  isLoadingMore: boolean // loading more tasks
  loadingTasks: LoadingTasks // show number of loading tasks per folder or root
  fetchNextPage: () => void
  reloadTableData: () => void
}

type Params = {
  projectName: string
  selectedFolders: string[] // folders selected in the slicer (hierarchy)
  queryFilters: ProjectOverviewContextProps['queryFilters'] // filters from the filters bar or slicer (not hierarchy)
  sorting: SortingState
  expanded: ExpandedState
  showHierarchy: boolean
}

const useFetchOverviewData = ({
  projectName,
  selectedFolders, // comes from the slicer
  queryFilters,
  sorting,
  expanded,
  showHierarchy,
}: Params): useFetchOverviewDataData => {
  const {
    data: { folders = [] } = {},
    isLoading,
    isFetching: isFetchingFolders,
    isUninitialized: isUninitializedFolders,
    refetch: refetchFolders,
  } = useGetFolderListQuery(
    { projectName: projectName || '', attrib: true },
    { skip: !projectName },
  )

  console.log('Folder count:', folders.length)
  const expandedParentIds = Object.entries(expanded)
    .filter(([, isExpanded]) => isExpanded)
    .map(([id]) => id)

  const {
    data: expandedFoldersTasks = [],
    isFetching: isFetchingExpandedFoldersTasks,
    refetch: refetchExpandedFoldersTasks,
    isUninitialized: isUninitializedExpandedFoldersTasks,
  } = useGetOverviewTasksByFoldersQuery(
    {
      projectName,
      parentIds: expandedParentIds,
      filter: queryFilters.filterString,
      search: queryFilters.search,
    },
    { skip: !expandedParentIds.length || !showHierarchy },
  )
  // get folders that would be left if the filters were applied for tasks
  const {
    data: foldersByTaskFilter,
    isUninitialized,
    isFetching: isFetchingTasksFolders,
    isUninitialized: isUninitializedTasksFolders,
    refetch: refetchTasksFolders,
  } = useGetQueryTasksFoldersQuery(
    {
      projectName,
      tasksFoldersQuery: { filter: queryFilters.filter, search: queryFilters.search },
    },
    {
      skip: !queryFilters.filterString || !folders.length || !showHierarchy,
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

    return map
  }, [folders, foldersByTaskFilter, isUninitialized, selectedFolders])

  // calculate partial loading states
  const loadingTasksForParents = useMemo(() => {
    if (isFetchingExpandedFoldersTasks) {
      return determineLoadingTaskFolders({
        expandedFoldersTasks,
        expandedParentIds,
        foldersMap,
      })
    } else return {}
  }, [isFetchingExpandedFoldersTasks, expandedFoldersTasks, expandedParentIds, foldersMap])

  const [tasksListCursor, setTasksListCursor] = useState('')

  // every time the sorting changes, reset the cursor
  useEffect(() => {
    if (tasksListCursor) setTasksListCursor('')
  }, [sorting, tasksListCursor])

  // Create sort params for infinite query
  const singleSort = { ...sorting[0] }
  // if task list and sorting by name, sort by path instead
  const sortByPath = singleSort?.id === 'name' && !showHierarchy
  const sortId = sortByPath ? 'path' : singleSort?.id === 'subType' ? 'taskType' : singleSort?.id

  // Use the new infinite query hook for tasks list with correct name
  const {
    data: tasksListInfiniteData,
    isFetching: isFetchingTasksList,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage: isFetchingNextPageTasksList,
    isUninitialized: isUninitializedTasksList,
    refetch: refetchTasksList,
  } = useGetTasksListInfiniteInfiniteQuery(
    {
      projectName,
      filter: queryFilters.filterString,
      search: queryFilters.search,
      folderIds: selectedFolders.length ? Array.from(foldersMap.keys()) : undefined,
      sortBy: sortId ? sortId.replace('_', '.') : undefined,
      desc: !!singleSort?.desc,
    },
    {
      skip: showHierarchy,
      initialPageParam: {
        cursor: '',
        desc: !!singleSort?.desc,
      },
    },
  )

  // Extract tasks from infinite query data correctly
  const tasksList = useMemo(() => {
    if (!tasksListInfiniteData?.pages) return []
    return tasksListInfiniteData.pages.flatMap((page) => page.tasks || [])
  }, [tasksListInfiniteData?.pages])

  const handleFetchNextPage = () => {
    if (hasNextPage) {
      console.log('fetching next page')
      fetchNextPage()
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

  // reload all data for all queries
  const reloadTableData = () => {
    // only reload if there is data
    if (!isUninitializedFolders) refetchFolders()
    if (!isUninitializedExpandedFoldersTasks) refetchExpandedFoldersTasks()
    if (!isUninitializedTasksFolders) refetchTasksFolders()
    if (!isUninitializedTasksList) refetchTasksList()
  }

  return {
    foldersMap: foldersMap,
    tasksMap: tasksMap,
    tasksByFolderMap: tasksByFolderMap,
    isLoadingAll:
      isLoading ||
      isFetchingFolders ||
      (isFetchingTasksList && !isFetchingNextPageTasksList) ||
      isFetchingTasksFolders, // these all show a full loading state
    isLoadingMore: isFetchingNextPageTasksList,
    loadingTasks: loadingTasksForParents,
    fetchNextPage: handleFetchNextPage,
    reloadTableData,
  }
}

export default useFetchOverviewData
