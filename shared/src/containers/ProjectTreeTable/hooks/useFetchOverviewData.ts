import {
  useGetGroupedTasksListQuery,
  useGetOverviewTasksByFoldersQuery,
  useGetSearchFoldersQuery,
  useGetSearchFolderIdsByTasksQuery,
  useGetTasksListInfiniteInfiniteQuery,
} from '@shared/api'
import type { FolderListItem, GetGroupedTasksListArgs, EntityGroup, QueryFilter } from '@shared/api'
import { useGroupedPagination } from '@shared/hooks'
import { getGroupByDataType } from '@shared/util'
import { EditorTaskNode, FolderNodeMap, MatchingFolder, TaskNodeMap } from '../types/table'
import { useEffect, useMemo, useState } from 'react'
import { ExpandedState, SortingState } from '@tanstack/react-table'
import { determineLoadingTaskFolders } from '../utils/loadingUtils'
import { LoadingTasks } from '../types'
import { TasksByFolderMap } from '../utils'
import { TableGroupBy } from '../context'
import { isGroupId, GROUP_BY_ID } from '../hooks/useBuildGroupByTableData'
import { ProjectTableAttribute } from '../hooks/useAttributesList'
import { ProjectTableModulesType } from '@shared/hooks'
import { useGetEntityLinksQuery } from '@shared/api'
import { useProjectFoldersContext } from '@shared/context'

type QueryFilterParams = {
  filter: QueryFilter | undefined
  filterString?: string
  search?: string
}

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
  taskIds?: string[] // specific task IDs to filter by (from entity list slicer)
  taskFilters: QueryFilterParams // filters for tasks
  folderFilters: QueryFilterParams // filters for folders
  sorting: SortingState
  groupBy: TableGroupBy | undefined
  taskGroups: EntityGroup[]
  taskGroupsCount?: number // override for number of items per group
  expanded: ExpandedState
  showHierarchy: boolean
  isFlatFolderView?: boolean
  attribFields: ProjectTableAttribute[]
  modules: ProjectTableModulesType
}

export const useFetchOverviewData = ({
  projectName,
  selectedFolders, // comes from the slicer
  taskIds, // specific task IDs from entity list slicer
  taskFilters,
  folderFilters,
  sorting,
  groupBy,
  taskGroups = [],
  taskGroupsCount,
  expanded,
  showHierarchy,
  isFlatFolderView = false,
  attribFields,
  modules,
}: Params): useFetchOverviewDataData => {
  const { getGroupQueries, isLoading: isLoadingModules } = modules

  const {
    folders,
    isLoading: isLoadingFolders,
    isUninitialized: isUninitializedFolders,
    refetch: refetchFolders,
  } = useProjectFoldersContext()

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
      filter: taskFilters.filterString,
      folderFilter: folderFilters.filterString,
      search: taskFilters.search,
    },
    { skip: !expandedParentIds.length || (!showHierarchy && !isFlatFolderView) },
  )

  const skipFoldersByTaskFilter =
    (!taskFilters.filterString &&
      !folderFilters.filterString &&
      !taskFilters.search &&
      !folderFilters.search) ||
    !folders.length ||
    (!showHierarchy && !isFlatFolderView)
  // get folders that would be left if the filters were applied for tasks
  const {
    data: foldersByTaskFilter,
    isUninitialized,
    isFetching: isFetchingTasksFolders,
    isUninitialized: isUninitializedTasksFolders,
    refetch: refetchTasksFolders,
  } = useGetSearchFoldersQuery(
    {
      projectName,
      folderSearchRequest: {
        taskFilter: taskFilters.filter?.conditions?.length ? taskFilters.filter : undefined,
        taskSearch: taskFilters.search,
        folderFilter: folderFilters.filter?.conditions?.length ? folderFilters.filter : undefined,
        folderSearch: folderFilters.search,
      },
    },
    {
      skip: skipFoldersByTaskFilter,
    },
  )

  // When text search is active, also derive folder IDs from matching tasks via GraphQL.
  // GraphQL tasks resolver splits search on commas (OR per chip) unlike the REST
  // searchFolders endpoint which ANDs all terms — fixes multi-folder search in hierarchy.
  const {
    data: folderIdsBySearch,
    isUninitialized: isUninitializedFolderIdsBySearch,
    refetch: refetchFolderIdsBySearch,
  } = useGetSearchFolderIdsByTasksQuery(
    {
      projectName,
      search: taskFilters.search,
      filter: taskFilters.filterString,
      folderFilter: folderFilters.filterString,
    },
    {
      skip: !taskFilters.search || !folders.length || (!showHierarchy && !isFlatFolderView),
    },
  )

  // create a list of folders that are current visible in the table
  // root folders are always visible
  // then a folder is visible if it's parent is expanded
  const visibleFolders = useMemo(() => {
    const visibleSet = new Set<string>()

    // Check each folder in the map
    folders.forEach((folder) => {
      // Root folders are always visible
      if (!folder.parentId) {
        visibleSet.add(folder.id)
        return
      }

      // Check if parent is expanded
      const parentId = folder.parentId as string
      const isSelectedInSlicer = selectedFolders.includes(folder.id as string)
      const expandedMap = expanded as Record<string, boolean>
      if (expandedMap[parentId] === true || isSelectedInSlicer) {
        visibleSet.add(folder.id)
      }
    })

    return visibleSet
  }, [folders, foldersByTaskFilter, skipFoldersByTaskFilter, expanded, selectedFolders])

  // get all links for visible folders
  const {
    data: foldersLinks = [],
    refetch: refetchFoldersLinks,
    isUninitialized: isUninitializedFoldersLinks,
  } = useGetEntityLinksQuery({
    projectName,
    entityIds: Array.from(visibleFolders),
    entityType: 'folder',
  })

  // create a map of folders by id for efficient lookups
  const foldersMap: FolderNodeMap = useMemo(() => {
    const map = new Map()

    const addExtraDataToFolder = (folder: FolderListItem) => {
      // add any extra data to folder
      const folderWithExtraData: MatchingFolder = {
        ...folder,
        entityId: folder.id,
        entityType: 'folder',
        links: foldersLinks?.find((link) => link.id === folder.id)?.links || [],
      }
      return folderWithExtraData
    }

    // If we have task filters and folders to filter
    const hasFilteredFolders =
      (!isUninitialized && foldersByTaskFilter !== undefined) ||
      (!isUninitializedFolderIdsBySearch && folderIdsBySearch !== undefined)

    if (hasFilteredFolders && folders.length) {
      // Create a set for efficient lookups of filtered folder IDs
      const relevantFolderIds = new Set<string>()

      // First pass: union REST filter results + GraphQL search results (comma-OR semantics)
      for (const folderId of foldersByTaskFilter ?? []) {
        relevantFolderIds.add(folderId)
      }
      for (const folderId of folderIdsBySearch ?? []) {
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

      // In flat folder view folders are shown as top-level rows — ancestors are
      // not needed and would bring in unrelated subtrees (e.g. showing the root
      // "assets" node which then exposes all its children).
      // In hierarchy mode ancestors ARE needed so the tree path is navigable.
      if (!isFlatFolderView) {
        const matchedIds = [...relevantFolderIds]
        for (const folderId of matchedIds) {
          addParents(folderId)
        }
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
  }, [folders, foldersByTaskFilter, folderIdsBySearch, isUninitialized, isUninitializedFolderIdsBySearch, selectedFolders, foldersLinks])

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
  const tasksFolderIdsParams = selectedFolders.length ? Array.from(foldersMap.keys()) : undefined

  // Use the new infinite query hook for tasks list with correct name
  const {
    data: tasksListInfiniteData,
    isLoading: isLoadingTasksList,
    isFetching: isFetchingTasksList,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage: isFetchingNextPageTasksList,
    isUninitialized: isUninitializedTasksList,
    refetch: refetchTasksList,
  } = useGetTasksListInfiniteInfiniteQuery(
    {
      projectName,
      filter: taskFilters.filterString,
      folderFilter: folderFilters.filterString,
      search: taskFilters.search,
      folderIds: taskIds?.length ? undefined : tasksFolderIdsParams,
      taskIds: taskIds?.length ? taskIds : undefined,
      sortBy: sortId ? sortId.replace('_', '.') : undefined,
      desc: !!singleSort?.desc,
    },
    {
      // Use flat task list when entity list provides specific task IDs, even in hierarchy mode
      skip: (showHierarchy || isFlatFolderView) && !(taskIds?.length),
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

  const { pageCounts: groupPageCounts, incrementPageCount } = useGroupedPagination({
    groups: taskGroups,
  })

  // for grouped tasks, we fetch all tasks for each group
  // we do this by building a list of groups with filters for that group
  const groupByDataType = getGroupByDataType(groupBy, attribFields)

  // get expanded group values from the expanded state
  // group IDs are formatted as `_GROUP_<value>` so we extract the values
  const expandedGroupValues = useMemo(() => {
    return Object.entries(expanded)
      .filter(([, isExpanded]) => isExpanded)
      .filter(([id]) => isGroupId(id))
      .map(([id]) => id.slice(GROUP_BY_ID.length))
  }, [expanded])

  // get group queries from powerpack, filtered to only include expanded groups
  const groupQueries: GetGroupedTasksListArgs['groups'] = useMemo(() => {
    if (!groupBy) return []

    const allGroupQueries =
      getGroupQueries?.({
        groups: taskGroups,
        taskGroups, // deprecated, but keep for backward compatibility
        filters: taskFilters.filter,
        groupBy,
        groupPageCounts,
      }) ?? []

    // Only fetch tasks for groups that are expanded
    return allGroupQueries.filter((group) => expandedGroupValues.includes(group.value))
  }, [
    groupBy,
    taskGroups,
    groupPageCounts,
    groupByDataType,
    taskFilters.filter,
    getGroupQueries,
    expandedGroupValues,
  ])

  const {
    data: { tasks: groupTasks = [] } = {},
    isUninitialized: isUninitializedGroupedTasks,
    refetch: refetchGroupedTasks,
  } = useGetGroupedTasksListQuery(
    {
      projectName,
      groups: groupQueries,
      sortBy: sortId ? sortId.replace('_', '.') : undefined,
      desc: !!singleSort?.desc,
      search: taskFilters.search,
      folderFilter: folderFilters.filterString,
      folderIds: tasksFolderIdsParams,
      groupCount: taskGroupsCount,
    },
    {
      skip: !groupBy || !groupQueries.length || isLoadingModules,
    },
  )

  // Resolve which task source to use based on current mode
  // When entity list provides specific task IDs, use flat task list even in hierarchy mode
  const resolvedTasks = useMemo(() => {
    if (taskIds?.length) return tasksList
    if (showHierarchy || isFlatFolderView) return expandedFoldersTasks
    if (groupBy) return groupTasks
    return tasksList
  }, [taskIds, showHierarchy, isFlatFolderView, groupBy, tasksList, expandedFoldersTasks, groupTasks])

  // Get visible tasks for link fetching
  const visibleTasks = useMemo(() => {
    return new Set(resolvedTasks.map((task) => task.id))
  }, [resolvedTasks])

  // Get all links for visible tasks
  const {
    data: tasksLinks = [],
    refetch: refetchTasksLinks,
    isUninitialized: isUninitializedTasksLinks,
  } = useGetEntityLinksQuery(
    {
      projectName,
      entityIds: Array.from(visibleTasks),
      entityType: 'task',
    },
    {
      skip: visibleTasks.size === 0,
    },
  )

  const handleFetchNextPage = (group?: string) => {
    if (groupBy) {
      if (group && group in groupPageCounts) {
        incrementPageCount(group)
      }
    } else if (hasNextPage) {
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
      links: tasksLinks?.find((link) => link.id === task.id)?.links || [],
    })

    for (const task of resolvedTasks) {
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
        const existing = tasksByFolderMap.get(folderId)!
        if (!existing.includes(taskId)) {
          existing.push(taskId)
        }
      } else {
        tasksByFolderMap.set(folderId, [taskId])
      }
    }

    return { tasksMap, tasksByFolderMap }
  }, [resolvedTasks, tasksLinks])

  // When entity list provides specific task IDs, filter folders to only those containing tasks
  const filteredFoldersMap: FolderNodeMap = useMemo(() => {
    if (!taskIds?.length || !tasksByFolderMap.size) return foldersMap

    const relevantFolderIds = new Set<string>()

    // Add all folders that contain selected tasks
    for (const folderId of tasksByFolderMap.keys()) {
      relevantFolderIds.add(folderId)
    }

    // Add parent folders for proper tree display
    const addParents = (folderId: string) => {
      const folder = foldersMap.get(folderId)
      if (folder && folder.parentId) {
        const parentId = folder.parentId as string
        if (!relevantFolderIds.has(parentId)) {
          relevantFolderIds.add(parentId)
          addParents(parentId)
        }
      }
    }

    for (const folderId of relevantFolderIds) {
      addParents(folderId)
    }

    const filtered = new Map() as FolderNodeMap
    for (const [id, folder] of foldersMap) {
      if (relevantFolderIds.has(id)) {
        filtered.set(id, folder)
      }
    }

    return filtered
  }, [foldersMap, tasksByFolderMap, taskIds])

  // reload all data for all queries
  const reloadTableData = () => {
    // only reload if there is data
    if (!isUninitializedFolders) refetchFolders()
    if (!isUninitializedExpandedFoldersTasks) refetchExpandedFoldersTasks()
    if (!isUninitializedTasksFolders) refetchTasksFolders()
    if (!isUninitializedFolderIdsBySearch) refetchFolderIdsBySearch()
    if (!isUninitializedTasksList) refetchTasksList()
    if (!isUninitializedGroupedTasks) refetchGroupedTasks()
    if (!isUninitializedFoldersLinks) refetchFoldersLinks()
    if (!isUninitializedTasksLinks) refetchTasksLinks()
  }

  return {
    foldersMap: filteredFoldersMap,
    tasksMap: tasksMap,
    tasksByFolderMap: tasksByFolderMap,
    isLoadingAll:
      isLoadingFolders || isLoadingTasksList || isFetchingTasksFolders || isLoadingModules, // these all show a full loading state
    isLoadingMore: isFetchingNextPageTasksList,
    loadingTasks: loadingTasksForParents,
    fetchNextPage: handleFetchNextPage,
    reloadTableData,
  }
}
