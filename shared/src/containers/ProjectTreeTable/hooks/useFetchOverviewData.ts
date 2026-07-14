import {
  clearOverviewTasksByFoldersRegistry,
  useGetGroupedTasksListQuery,
  useGetOverviewTasksByFoldersQuery,
  useGetSearchFoldersQuery,
  useGetTasksListInfiniteInfiniteQuery,
} from '@shared/api'
import type { FolderListItem, GetGroupedTasksListArgs, EntityGroup, QueryFilter } from '@shared/api'
import { useGroupedPagination } from '@shared/hooks'
import { getGroupByDataType } from '@shared/util'
import { EditorTaskNode, FolderNodeMap, MatchingFolder, TaskNodeMap } from '../types/table'
import { useEffect, useMemo, useState } from 'react'
import { ExpandedState, SortingState } from '@tanstack/react-table'
import { determineLoadingTaskFolders } from '../utils/loadingUtils'
import { LoadingTasks, SoftErrorAction } from '../types'
import { getFolderIdsToQueryFromExpanded, TasksByFolderMap } from '../utils'
import { TableGroupBy } from '../context'
import { isGroupId, GROUP_BY_ID } from '../hooks/useBuildGroupByTableData'
import { getGroupQueries } from '../utils/getGroupQueries'
import { ProjectTableAttribute } from '../hooks/useAttributesList'
import { ProjectTableModulesType } from '@shared/hooks'
import { useGetEntityLinksQuery } from '@shared/api'
import { OnSyncDataCallback, useProjectFoldersContext } from '@shared/context'
import { debounce } from 'lodash'

// how long a folder must stay rendered in the viewport before its tasks are fetched.
// prevents firing a request per folder while the user is quickly scrolling past them.
const VISIBLE_FOLDERS_DEBOUNCE_MS = 300

type QueryFilterParams = {
  filter: QueryFilter | undefined
  filterString?: string
  search?: string
}

type useFetchOverviewDataData = {
  foldersMap: FolderNodeMap
  tasksMap: TaskNodeMap
  tasksByFolderMap: TasksByFolderMap
  error?: unknown // first task/folder load failure (e.g. corrupt filter), if any
  softError?: string // error for fetching tasks for expanded folders, if any
  softErrorAction?: SoftErrorAction
  isLoadingAll: boolean // the whole table is a loading state
  isLoadingMore: boolean // loading more tasks
  loadingTasks: LoadingTasks // show number of loading tasks per folder or root
  loadingLinksEntityIds: Set<string> // entity IDs whose links are currently being fetched (not yet cached)
  fetchNextPage: (value?: string) => void
  onSyncData: OnSyncDataCallback
}

type Params = {
  projectName: string
  selectedFolders: string[] // folders selected in the slicer (hierarchy)
  excludeSelectedFolders?: boolean
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
  skipLinks?: boolean
  showComments?: boolean // only fetch latestComments when the comments column is visible
  onCollapseAll?: () => void
  // entity ids currently rendered in the table's viewport (hierarchy mode only) - used to
  // scope task fetching to folders actually on screen, rather than every expanded folder
  visibleEntityIds?: string[]
}

export const useFetchOverviewData = ({
  projectName,
  selectedFolders, // comes from the slicer
  excludeSelectedFolders = false,
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
  skipLinks,
  showComments = false,
  onCollapseAll,
  visibleEntityIds = [],
}: Params): useFetchOverviewDataData => {
  const { isLoading: isLoadingModules } = modules

  const {
    folders,
    isLoading: isLoadingFolders,
    isUninitialized: isUninitializedFolders,
    refetch: refetchFolders,
    getFolderById,
  } = useProjectFoldersContext()

  const expandedParentIds = Object.entries(expanded)
    .filter(([, isExpanded]) => isExpanded)
    .filter(([id]) => !isGroupId(id)) // filter out the root folder
    .map(([id]) => id)

  const expandedFolderIdsToQuery = useMemo(
    () =>
      getFolderIdsToQueryFromExpanded({
        expanded,
        expandedParentIds,
        selectedFolders,
        excludeSelectedFolders,
        getFolderById,
        showHierarchy,
      }),
    [
      expanded,
      expandedParentIds,
      selectedFolders,
      excludeSelectedFolders,
      getFolderById,
      showHierarchy,
    ],
  )

  // Debounce the rendered viewport rows so fast scrolling doesn't fire a new
  // request for every folder scrolled past - only once it's settled on screen.
  const [debouncedVisibleEntityIds, setDebouncedVisibleEntityIds] =
    useState<string[]>(visibleEntityIds)

  const debouncedSetVisible = useMemo(
    () =>
      debounce((ids: string[]) => setDebouncedVisibleEntityIds(ids), VISIBLE_FOLDERS_DEBOUNCE_MS),
    [],
  )

  useEffect(() => {
    debouncedSetVisible(visibleEntityIds)
    return () => debouncedSetVisible.cancel()
  }, [visibleEntityIds, debouncedSetVisible])

  // In hierarchy mode, only fetch tasks for expanded folders that are currently
  // rendered in the viewport, instead of every expanded folder in the tree.
  // Not applied to flat folder view: rows there are top-level folders, not
  // nested paths, so there's no "off screen ancestor" case to guard against,
  // and filtering there would delay every row's expand-to-reveal-tasks interaction.
  const visibleFolderIdsToQuery = useMemo(() => {
    if (!showHierarchy || isFlatFolderView) {
      return expandedFolderIdsToQuery
    }
    const visibleIdsSet = new Set(debouncedVisibleEntityIds)
    return expandedFolderIdsToQuery.filter((id) => visibleIdsSet.has(id))
  }, [expandedFolderIdsToQuery, showHierarchy, isFlatFolderView, debouncedVisibleEntityIds])

  const {
    data: expandedFoldersTasks = [],
    isFetching: isFetchingExpandedFoldersTasks,
    error: expandedFoldersTasksError,
    refetch: refetchExpandedFoldersTasks,
    isUninitialized: isUninitializedExpandedFoldersTasks,
  } = useGetOverviewTasksByFoldersQuery(
    {
      projectName,
      parentIds: visibleFolderIdsToQuery,
      filter: taskFilters.filterString,
      folderFilter: folderFilters.filterString,
      search: taskFilters.search,
      showComments,
    },
    { skip: !visibleFolderIdsToQuery.length || (!showHierarchy && !isFlatFolderView) },
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
    isFetching: isFetchingFoldersByTaskFilter,
    isLoading: isLoadingTasksFolders,
    isUninitialized: isUninitializedTasksFolders,
    error: searchFoldersError,
    refetch: refetchTasksFolders,
  } = useGetSearchFoldersQuery(
    {
      projectName,
      folderSearchRequest: {
        taskFilter: taskFilters.filter?.conditions?.length ? taskFilters.filter : undefined,
        folderFilter: folderFilters.filter?.conditions?.length ? folderFilters.filter : undefined,
        search: taskFilters.search,
      },
    },
    {
      skip: skipFoldersByTaskFilter,
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
      const isRootFromSlicer = excludeSelectedFolders
        ? selectedFolders.includes(parentId)
        : selectedFolders.includes(folder.id as string)
      const expandedMap = expanded as Record<string, boolean>
      if (expandedMap[parentId] === true || isRootFromSlicer) {
        visibleSet.add(folder.id)
      }
    })

    return visibleSet
  }, [
    folders,
    foldersByTaskFilter,
    skipFoldersByTaskFilter,
    expanded,
    selectedFolders,
    excludeSelectedFolders,
  ])

  // get all links for visible folders
  const {
    data: foldersLinks = [],
    refetch: refetchFoldersLinks,
    isUninitialized: isUninitializedFoldersLinks,
    isFetching: isFetchingFoldersLinks,
  } = useGetEntityLinksQuery(
    {
      projectName,
      entityIds: Array.from(visibleFolders),
      entityType: 'folder',
    },
    { skip: skipLinks },
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
        links: foldersLinks?.find((link) => link.id === folder.id)?.links || [],
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
        .map((id) => folders.find((folder) => folder.id === id)?.path)
        .filter(Boolean) as string[]

      // Create a new map that only contains selected folders and their children
      const filteredMap = new Map()

      // For each folder, check if it should be included
      map.forEach((folder, folderId) => {
        const folderPath = folder.path as string

        const isSelected = selectedPaths.includes(folderPath)

        // Include if it's a child of any selected folder
        const isChild = selectedPaths.some((selectedPath) =>
          folderPath.startsWith(selectedPath + '/'),
        )

        if (isChild || (isSelected && (!excludeSelectedFolders || isFlatFolderView))) {
          filteredMap.set(folderId, addExtraDataToFolder(folder))
        }
      })

      return filteredMap
    }

    return map
  }, [
    folders,
    foldersByTaskFilter,
    isUninitialized,
    selectedFolders,
    excludeSelectedFolders,
    foldersLinks,
    isFlatFolderView,
  ])

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
  const tasksFolderIdsParams = selectedFolders.length
    ? Array.from(
        new Set([...foldersMap.keys(), ...(excludeSelectedFolders ? selectedFolders : [])]),
      )
    : undefined

  // In hierarchy mode with slicer-selected folders, use GetTasksList with folderIds to fetch
  // tasks directly under those folders in a single paginated request, rather than firing one
  // request per folder via getOverviewTasksByFolders.
  const hierarchySlicerFolderIds =
    showHierarchy && excludeSelectedFolders && selectedFolders.length ? selectedFolders : undefined

  // Use the new infinite query hook for tasks list with correct name
  const {
    data: tasksListInfiniteData,
    isFetching: isFetchingTasksList,
    isLoading: isLoadingTasksList,
    error: tasksListError,
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
      folderIds: taskIds?.length
        ? undefined
        : hierarchySlicerFolderIds ?? (selectedFolders?.length ? selectedFolders : undefined),
      taskIds: taskIds?.length ? taskIds : undefined,
      sortBy: sortId ? sortId.replace('_', '.') : undefined,
      desc: !!singleSort?.desc,
      showComments,
      includeFolderChildren: !hierarchySlicerFolderIds, // Disable recursive task fetch for hierarchy+slicer mode
    },
    {
      // Skip flat task list for flat folder view (tasks loaded on folder expand).
      // In hierarchy+slicer mode, run it to fetch tasks under selected-but-hidden folders.
      // Always run it when entity list provides specific task IDs.
      skip: ((showHierarchy && !hierarchySlicerFolderIds) || isFlatFolderView) && !taskIds?.length,
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

  const groupQueries: GetGroupedTasksListArgs['groups'] = useMemo(() => {
    if (!groupBy) return []

    const allGroupQueries = getGroupQueries({
      groups: taskGroups,
      // @ts-expect-error: filter is the same
      filters: taskFilters.filter,
      groupBy,
      groupPageCounts,
      dataType: groupByDataType,
    })

    // Only fetch tasks for groups that are expanded
    return allGroupQueries.filter((group) => expandedGroupValues.includes(group.value))
  }, [
    groupBy,
    taskGroups,
    groupPageCounts,
    groupByDataType,
    taskFilters.filter,
    expandedGroupValues,
  ])

  const {
    data: { tasks: groupTasks = [] } = {},
    isFetching: isFetchingGroupedTasks,
    isUninitialized: isUninitializedGroupedTasks,
    error: groupedTasksError,
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
      showComments,
    },
    {
      skip: !groupBy || !groupQueries.length || isLoadingModules,
    },
  )

  // Resolve which task source to use based on current mode
  // When entity list provides specific task IDs, use flat task list even in hierarchy mode
  const resolvedTasks = useMemo(() => {
    if (taskIds?.length) return tasksList
    if (isFlatFolderView) return expandedFoldersTasks
    if (showHierarchy) {
      // In hierarchy+slicer mode, merge per-folder expanded tasks with tasks fetched via
      // GetTasksList for the slicer-selected (but not displayed) folders.
      if (hierarchySlicerFolderIds) return [...expandedFoldersTasks, ...tasksList]
      return expandedFoldersTasks
    }
    if (groupBy) return groupTasks
    return tasksList
  }, [
    taskIds,
    showHierarchy,
    hierarchySlicerFolderIds,
    isFlatFolderView,
    groupBy,
    tasksList,
    expandedFoldersTasks,
    groupTasks,
  ])

  // Get visible tasks for link fetching
  const visibleTasks = useMemo(() => {
    return new Set(resolvedTasks.map((task) => task.id))
  }, [resolvedTasks])

  // Get all links for visible tasks
  const {
    data: tasksLinks = [],
    refetch: refetchTasksLinks,
    isUninitialized: isUninitializedTasksLinks,
    isFetching: isFetchingTasksLinks,
  } = useGetEntityLinksQuery(
    {
      projectName,
      entityIds: Array.from(visibleTasks),
      entityType: 'task',
    },
    {
      skip: visibleTasks.size === 0 || skipLinks,
    },
  )

  // Compute entity IDs whose links are currently loading (in query but not yet in the cache result)
  const loadingLinksEntityIds = useMemo(() => {
    const ids = new Set<string>()

    if (isFetchingFoldersLinks && !skipLinks) {
      const cachedIds = new Set(foldersLinks.map((l) => l.id))
      for (const id of visibleFolders) {
        if (!cachedIds.has(id)) ids.add(id)
      }
    }

    if (isFetchingTasksLinks && !skipLinks) {
      const cachedIds = new Set(tasksLinks.map((l) => l.id))
      for (const id of visibleTasks) {
        if (!cachedIds.has(id)) ids.add(id)
      }
    }

    return ids
  }, [
    isFetchingFoldersLinks,
    isFetchingTasksLinks,
    foldersLinks,
    tasksLinks,
    visibleFolders,
    visibleTasks,
    skipLinks,
  ])

  const handleFetchNextPage = (group?: string) => {
    if (groupBy) {
      // Ungrouped is never seeded into pageCounts, so don't gate on key presence
      if (group) {
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
        // dedup like tasksMap — resolvedTasks can contain the same task twice
        // (overlapping infinite-query pages, or a task in multiple groups)
        const folderTaskIds = tasksByFolderMap.get(folderId)!
        if (!folderTaskIds.includes(taskId)) folderTaskIds.push(taskId)
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

  const onSyncData: OnSyncDataCallback = async (updates = []) => {
    const isFullSync = updates.length === 0
    const hasFolderUpdates = updates.some((update) => update.topic.startsWith('entity.folder.'))
    const hasTaskUpdates = updates.some((update) => update.topic.startsWith('entity.task.'))

    const refetches: Promise<unknown>[] = []
    if ((isFullSync || hasFolderUpdates) && !isUninitializedFolders) {
      refetches.push(refetchFolders())
    }
    if ((isFullSync || hasFolderUpdates || hasTaskUpdates) && !isUninitializedTasksFolders) {
      refetches.push(refetchTasksFolders().unwrap())
    }
    if ((isFullSync || hasTaskUpdates) && !isUninitializedExpandedFoldersTasks) {
      clearOverviewTasksByFoldersRegistry(projectName)
      refetches.push(refetchExpandedFoldersTasks().unwrap())
    }
    if ((isFullSync || hasTaskUpdates) && !isUninitializedTasksList) {
      refetches.push(refetchTasksList().unwrap())
    }
    if ((isFullSync || hasTaskUpdates) && !isUninitializedGroupedTasks) {
      refetches.push(refetchGroupedTasks().unwrap())
    }
    if ((isFullSync || hasFolderUpdates) && !isUninitializedFoldersLinks) {
      refetches.push(refetchFoldersLinks().unwrap())
    }
    if ((isFullSync || hasTaskUpdates) && !isUninitializedTasksLinks) {
      refetches.push(refetchTasksLinks().unwrap())
    }
    await Promise.all(refetches)
  }

  const error = tasksListError || searchFoldersError || groupedTasksError

  const softErrorAction = useMemo<SoftErrorAction | undefined>(() => {
    if (expandedFoldersTasksError && onCollapseAll) {
      return {
        label: 'Collapse all folders',
        icon: 'restart_alt',
        callback: onCollapseAll,
      }
    }
    return undefined
  }, [expandedFoldersTasksError, onCollapseAll])

  return {
    foldersMap: filteredFoldersMap,
    tasksMap: tasksMap,
    tasksByFolderMap: tasksByFolderMap,
    error,
    // @ts-expect-error: error does exist on it
    softError: expandedFoldersTasksError?.error, // this is separate as we should still show the folders table so the user can make changes
    softErrorAction,
    isLoadingAll:
      isLoadingFolders || isLoadingTasksList || isLoadingTasksFolders || isLoadingModules, // these all show a full loading state
    isLoadingMore: isFetchingNextPageTasksList,
    loadingTasks: loadingTasksForParents,
    loadingLinksEntityIds,
    fetchNextPage: handleFetchNextPage,
    onSyncData,
  }
}
