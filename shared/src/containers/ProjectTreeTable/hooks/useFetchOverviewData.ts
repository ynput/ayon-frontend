import {
  useGetFolderListQuery,
  useGetGroupedTasksListQuery,
  useGetOverviewTasksByFoldersQuery,
  useGetQueryTasksFoldersQuery,
  useGetTasksListInfiniteInfiniteQuery,
} from '@shared/api'
import type {
  FolderListItem,
  GetGroupedTasksListArgs,
  EntityGroup,
  QueryTasksFoldersApiArg,
  QueryFilter,
} from '@shared/api'
import { useGroupedPagination } from '@shared/hooks'
import { getGroupByDataType } from '@shared/util'
import { EditorTaskNode, FolderNodeMap, MatchingFolder, TaskNodeMap } from '../types/table'
import { useEffect, useMemo, useState } from 'react'
import { ExpandedState, SortingState } from '@tanstack/react-table'
import { determineLoadingTaskFolders } from '../utils/loadingUtils'
import { LoadingTasks } from '../types'
import { TasksByFolderMap } from '../utils'
import { TableGroupBy } from '../context'
import { isGroupId } from '../hooks/useBuildGroupByTableData'
import { ProjectTableAttribute } from '../hooks/useAttributesList'
import { ProjectTableModulesType } from '@shared/hooks'
import { useGetEntityLinksQuery } from '@shared/api'
import { useQueryArgumentChangeLoading } from '@shared/hooks'

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
  queryFilters: {
    filter: QueryFilter | undefined
    filterString?: string
    search: QueryTasksFoldersApiArg['tasksFoldersQuery']['search']
  } // filters from the filters bar or slicer (not hierarchy)
  sorting: SortingState
  groupBy: TableGroupBy | undefined
  taskGroups: EntityGroup[]
  expanded: ExpandedState
  showHierarchy: boolean
  attribFields: ProjectTableAttribute[]
  modules: ProjectTableModulesType
}

export const useFetchOverviewData = ({
  projectName,
  selectedFolders, // comes from the slicer
  queryFilters,
  sorting,
  groupBy,
  taskGroups = [],
  expanded,
  showHierarchy,
  attribFields,
  modules,
}: Params): useFetchOverviewDataData => {
  const { getGroupQueries, isLoading: isLoadingModules } = modules

  const {
    data: { folders = [] } = {},
    isLoading,
    isFetching: isFetchingFoldersRaw,
    isUninitialized: isUninitializedFolders,
    refetch: refetchFolders,
  } = useGetFolderListQuery(
    { projectName: projectName || '', attrib: true },
    { skip: !projectName },
  )

  const isFetchingFolders = useQueryArgumentChangeLoading(
    { projectName: projectName || '' },
    isFetchingFoldersRaw,
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

  const skipFoldersByTaskFilter = !queryFilters.filterString || !folders.length || !showHierarchy
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
  }, [folders, foldersByTaskFilter, isUninitialized, selectedFolders, foldersLinks])

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
      filter: queryFilters.filterString,
      search: queryFilters.search,
      folderIds: tasksFolderIdsParams,
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

  const { pageCounts: groupPageCounts, incrementPageCount } = useGroupedPagination({
    groups: taskGroups,
  })

  // for grouped tasks, we fetch all tasks for each group
  // we do this by building a list of groups with filters for that group
  const groupByDataType = getGroupByDataType(groupBy, attribFields)

  // get group queries from powerpack
  const groupQueries: GetGroupedTasksListArgs['groups'] = useMemo(() => {
    return groupBy
      ? getGroupQueries?.({
          groups: taskGroups,
          filters: queryFilters.filter,
          groupBy,
          groupPageCounts,
        }) ?? []
      : []
  }, [groupBy, taskGroups, groupPageCounts, groupByDataType, queryFilters.filter, getGroupQueries])

  const {
    data: { tasks: groupTasks = [] } = {},
    isFetching: isFetchingGroups,
    isUninitialized: isUninitializedGroupedTasks,
    refetch: refetchGroupedTasks,
  } = useGetGroupedTasksListQuery(
    {
      projectName,
      groups: groupQueries,
      sortBy: sortId ? sortId.replace('_', '.') : undefined,
      desc: !!singleSort?.desc,
      search: queryFilters.search,
      folderIds: tasksFolderIdsParams,
    },
    {
      skip: !groupBy || !groupQueries.length || isLoadingModules,
    },
  )

  // Get visible tasks for link fetching
  const visibleTasks = useMemo(() => {
    const allTasks = showHierarchy ? expandedFoldersTasks : groupBy ? groupTasks : tasksList
    return new Set(allTasks.map((task) => task.id))
  }, [expandedFoldersTasks, showHierarchy, tasksList, groupTasks, groupBy])

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
        console.log('fetching next page for group:', group)
        incrementPageCount(group)
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
      links: tasksLinks?.find((link) => link.id === task.id)?.links || [],
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
  }, [expandedFoldersTasks, showHierarchy, tasksList, groupTasks, tasksLinks])

  // reload all data for all queries
  const reloadTableData = () => {
    // only reload if there is data
    if (!isUninitializedFolders) refetchFolders()
    if (!isUninitializedExpandedFoldersTasks) refetchExpandedFoldersTasks()
    if (!isUninitializedTasksFolders) refetchTasksFolders()
    if (!isUninitializedTasksList) refetchTasksList()
    if (!isUninitializedGroupedTasks) refetchGroupedTasks()
    if (!isUninitializedFoldersLinks) refetchFoldersLinks()
    if (!isUninitializedTasksLinks) refetchTasksLinks()
  }

  return {
    foldersMap: foldersMap,
    tasksMap: tasksMap,
    tasksByFolderMap: tasksByFolderMap,
    isLoadingAll:
      isLoading ||
      isFetchingFolders ||
      isLoadingTasksList ||
      isFetchingTasksFolders ||
      isFetchingGroups ||
      isLoadingModules, // these all show a full loading state
    isLoadingMore: isFetchingNextPageTasksList,
    loadingTasks: loadingTasksForParents,
    fetchNextPage: handleFetchNextPage,
    reloadTableData,
  }
}
