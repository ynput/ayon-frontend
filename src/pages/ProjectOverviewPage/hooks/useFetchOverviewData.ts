import {
  useGetFolderListQuery,
  useGetGroupedTasksListQuery,
  useGetOverviewTasksByFoldersQuery,
  useGetQueryTasksFoldersQuery,
  useGetTasksListInfiniteInfiniteQuery,
} from '@shared/api'
import type { FolderListItem, GetGroupedTasksListArgs, EntityGroup } from '@shared/api'
import {
  EditorTaskNode,
  FolderNodeMap,
  MatchingFolder,
  TaskNodeMap,
} from '@shared/containers/ProjectTreeTable/types/table'
import { useEffect, useMemo, useState } from 'react'
import { ExpandedState, SortingState } from '@tanstack/react-table'
import { ProjectOverviewContextProps } from '../context/ProjectOverviewContext'
import { determineLoadingTaskFolders } from '@shared/containers/ProjectTreeTable/utils/loadingUtils'
import { LoadingTasks } from '@shared/containers/ProjectTreeTable/types'
import { TasksByFolderMap } from '@shared/containers/ProjectTreeTable/utils'
import { TableGroupBy, useProjectTableModuleContext } from '@shared/containers'
import { Filter } from '@ynput/ayon-react-components'
import { isGroupId } from '@shared/containers/ProjectTreeTable/hooks/useBuildGroupByTableData'

type useFetchOverviewDataData = {
  foldersMap: FolderNodeMap
  tasksMap: TaskNodeMap
  tasksByFolderMap: TasksByFolderMap
  isLoadingAll: boolean // the whole table is a loading state
  isLoadingMore: boolean // loading more tasks
  loadingTasks: LoadingTasks // show number of loading tasks per folder or root
  fetchNextPage: (value?: string) => void
  reloadTableData: () => void
}

type Params = {
  projectName: string
  selectedFolders: string[] // folders selected in the slicer (hierarchy)
  filters: Filter[] // RAW filters (including slicer filters)
  queryFilters: ProjectOverviewContextProps['queryFilters'] // filters from the filters bar or slicer (not hierarchy)
  sorting: SortingState
  groupBy: TableGroupBy | undefined
  taskGroups: EntityGroup[]
  expanded: ExpandedState
  showHierarchy: boolean
}

const useFetchOverviewData = ({
  projectName,
  selectedFolders, // comes from the slicer
  filters,
  queryFilters,
  sorting,
  groupBy,
  taskGroups = [],
  expanded,
  showHierarchy,
}: Params): useFetchOverviewDataData => {
  const { getGroupQueries, isLoading: isLoadingModules } = useProjectTableModuleContext()

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

  // console.log('Folder count:', folders.length)
  const expandedParentIds = Object.entries(expanded)
    .filter(([, isExpanded]) => isExpanded)
    .filter(([id]) => !isGroupId(id)) // filter out the root folder
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

    const addExtraDataToFolder = (folder: FolderListItem) => {
      // add any extra data to folder
      const folderWithExtraData: MatchingFolder = {
        ...folder,
        entityId: folder.id,
        entityType: 'folder',
      }
      return folderWithExtraData
    }

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
          map.set(folder.id as string, addExtraDataToFolder(folder))
        }
      }
    } else {
      // No filtering, include all folders
      for (const folder of folders) {
        map.set(folder.id as string, addExtraDataToFolder(folder))
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
          filteredMap.set(folderId, addExtraDataToFolder(folder))
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

  const initGroupPageCounts = useMemo(() => {
    return taskGroups.reduce((acc, group) => {
      acc[group.value] = 1 // initialize each group with 1 count
      return acc
    }, {} as Record<string, number>)
  }, [taskGroups])
  const [groupPageCounts, setGroupPageCounts] = useState<Record<string, number>>({})

  // when initGroupPageCounts changes, set it to groupPageCounts
  useEffect(() => {
    const hasInitData = Object.keys(initGroupPageCounts).length > 0
    const hasCurrentData = Object.keys(groupPageCounts).length > 0

    if (hasInitData && !hasCurrentData) {
      setGroupPageCounts(initGroupPageCounts)
    }
  }, [initGroupPageCounts])

  // for grouped tasks, we fetch all tasks for each group
  // we do this by building a list of groups with filters for that group

  const groupQueries: GetGroupedTasksListArgs['groups'] = useMemo(() => {
    return groupBy
      ? getGroupQueries?.({
          taskGroups,
          filters,
          groupBy,
          groupPageCounts,
        }) ?? []
      : []
  }, [groupBy, taskGroups, filters, groupPageCounts])

  const { data: { tasks: groupTasks = [] } = {}, isFetching: isFetchingGroups } =
    useGetGroupedTasksListQuery(
      {
        projectName,
        groups: groupQueries,
        sortBy: sortId ? sortId.replace('_', '.') : undefined,
        desc: !!singleSort?.desc,
        search: queryFilters.search,
      },
      {
        skip: !groupBy || !groupQueries.length || isLoadingModules,
      },
    )

  const handleFetchNextPage = (group?: string) => {
    if (groupBy) {
      console.log(groupPageCounts)
      if (group && group in groupPageCounts) {
        console.log('fethching next page for group:', group)
        // fetch next page for a specific group by increasing the count in groupPageCounts
        setGroupPageCounts((prevCounts) => {
          const newCounts = { ...prevCounts }
          newCounts[group] = (newCounts[group] || 1) + 1 // increment the count for this group
          return newCounts
        })
      }
    } else if (hasNextPage) {
      console.log('fetching next page')
      fetchNextPage()
    }
  }

  // tasksMaps is a map of tasks by task ID
  // tasksByFolderMap is a map of tasks by folder ID
  const { tasksMap, tasksByFolderMap } = useMemo(() => {
    const tasksMap: TaskNodeMap = new Map()
    const tasksByFolderMap: TasksByFolderMap = new Map()

    const addExtraDataToTask = (task: EditorTaskNode) => ({
      ...task,
      entityId: task.id,
      entityType: 'task' as const,
    })

    // either show the hierarchy or the flat list of tasks
    const allTasks = showHierarchy ? expandedFoldersTasks : groupBy ? groupTasks : tasksList
    for (const task of allTasks) {
      const taskId = task.id as string
      const folderId = task.folderId as string

      if (tasksMap.has(taskId)) {
        // merge specific data if the task already exists
        const existingTask = tasksMap.get(taskId) as EditorTaskNode
        const currentTask = addExtraDataToTask(task)
        const mergedTask = {
          ...existingTask,
          ...currentTask,
          groups: [...(existingTask.groups || []), ...(currentTask.groups || [])],
        }

        tasksMap.set(taskId, mergedTask)
      } else {
        tasksMap.set(taskId, addExtraDataToTask(task))
      }

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
      isFetchingTasksFolders ||
      isFetchingGroups ||
      isLoadingModules, // these all show a full loading state
    isLoadingMore: isFetchingNextPageTasksList,
    loadingTasks: loadingTasksForParents,
    fetchNextPage: handleFetchNextPage,
    reloadTableData,
  }
}

export default useFetchOverviewData
