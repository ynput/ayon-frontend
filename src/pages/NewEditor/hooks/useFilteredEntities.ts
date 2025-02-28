import { useMemo } from 'react'
import { EditorTaskNode, FolderNodeMap, MatchingFolder, TaskNodeMap } from '../types'
import { Filter } from '@components/SearchFilter/types'
import { FolderAttribType, FolderNode, TaskAttribType } from '@api/graphql'
import getFilterFromId from '@components/SearchFilter/getFilterFromId'
import { $Any } from '@types'

type GetFilteredEntitiesData = {
  folders: FolderNodeMap
  tasks: TaskNodeMap
  taskList: Partial<EditorTaskNode>[]
}

type GetFilteredEntitiesParams = {
  folders: FolderNodeMap
  tasksMap: TaskNodeMap
  tasksFolders?: string[]
  filters: Filter[]
}

const useFilteredEntities = ({
  folders,
  tasksMap,
  tasksFolders = [],
  filters,
}: GetFilteredEntitiesParams): GetFilteredEntitiesData => {
  // efficient
  const filtersMap = getFiltersMap(filters)

  // 1.8ms down to 0.8ms
  //   semi-efficient - look at isMatchingFolderFilters
  const filteredFolders = useMemo(
    () => getFilteredFolders(folders, filters, filtersMap),
    [folders, filters, filtersMap],
  )

  //   semi-efficient - look at isMatchingFolderFilters
  const filteredTasksMap = getFilteredTasks(tasksMap, filters, filtersMap)
  const filteredTasksList = Array.from(filteredTasksMap.values())

  console.time('treeFoldersCreation')
  const treeFolders = useMemo(() => {
    return createTreeFolders(filteredFolders, tasksFolders, filtersMap)
  }, [filteredFolders, tasksFolders, filtersMap])
  console.timeEnd('treeFoldersCreation')

  console.log(treeFolders)

  return {
    folders: filteredFolders,
    tasks: filteredTasksMap,
    taskList: filteredTasksList,
  }
}

export default useFilteredEntities

const createTreeFolders = (
  filteredFolders: FolderNodeMap,
  tasksFolders: string[],
  filtersMap: Map<string, $Any[]>,
) => {
  // Create a Set of paths for O(1) lookups
  const pathSet = new Set<string>()
  const validFolders = tasksFolders.filter((id) => filteredFolders.get(id))

  // Pre-calculate approximate size for path arrays
  const estimatedPathCount = validFolders.length * 5 // assuming average path depth of 5
  const paths = new Array<string>(estimatedPathCount)
  let pathIndex = 0

  // Build all possible paths in a single pass
  for (const id of validFolders) {
    const folderPath = filteredFolders.get(id)!.path!
    let currentPath = ''
    for (const segment of folderPath.split('/')) {
      currentPath = currentPath ? `${currentPath}/${segment}` : segment
      if (!pathSet.has(currentPath)) {
        pathSet.add(currentPath)
        paths[pathIndex++] = currentPath
      }
    }
  }

  const filteredFolderIds = new Set(filteredFolders.keys())
  const hasFilters = filtersMap.size > 0
  const treeFolders: FolderNodeMap = new Map()

  for (const [id, folder] of filteredFolders) {
    if (pathSet.has(folder.path!)) {
      treeFolders.set(id, {
        ...folder,
        childOnlyMatch: !hasFilters || filteredFolderIds.has(id),
      })
    }
  }
  return treeFolders
}

const strongFilters = ['assignees']

const getFiltersMap = (filters: Filter[]) => {
  return filters.reduce((filtersAcc: Map<string, $Any[]>, filter: Filter) => {
    const filterId = getFilterFromId(filter.id)
    const values = (filter.values ?? []).reduce((acc2: $Any[], filterValue) => {
      if (filter.type === 'integer') {
        acc2.push(parseInt(filterValue.id))
      } else if (filter.type === 'float') {
        acc2.push(parseFloat(filterValue.id))
      } else if (filter.type === 'string' || filter.type === 'list_of_strings') {
        acc2.push(filterValue.id)
      }
      return acc2
    }, [])
    filtersAcc.set(filterId, values)
    return filtersAcc
  }, new Map<string, $Any[]>())
}

const getFilteredFolders = (
  folders: FolderNodeMap,
  filters: $Any,
  filtersMap: Map<string, $Any[]>,
): FolderNodeMap => {
  if (!filters?.length) {
    return folders
  }

  let filteredFolders: FolderNodeMap = new Map()
  for (const id of folders.keys()) {
    if (isMatchingFolderFilters(folders.get(id)!, filtersMap)) {
      filteredFolders.set(id, folders.get(id)!)
    }
  }
  return filteredFolders
}

const getFilteredTasks = (
  tasks: TaskNodeMap,
  filters: $Any,
  filtersMap: Map<string, $Any[]>,
): TaskNodeMap => {
  if (!filters) {
    return tasks
  }

  let filteredTasks: TaskNodeMap = new Map()
  for (const id of tasks.keys()) {
    const task = tasks.get(id)
    if (task && isMatchingTaskFilters(task, filtersMap)) {
      filteredTasks.set(id, {
        ...task,
      })
    }
  }
  return filteredTasks
}

const isMatchingFolderFilter = (
  folder: FolderNode,
  filterType: keyof FolderNode | keyof FolderAttribType,
  filterValues: string[],
) => {
  if (strongFilters.includes(filterType)) {
    // some filters are task specific and should be ignored for folders
    if (folder[filterType as keyof FolderNode] === undefined) {
      return false
    }

    return listsIntersect(folder[filterType as keyof FolderNode] as string[], filterValues)
  }

  // some filters are task specific and should be ignored for folders
  if (folder.attrib[filterType as keyof FolderAttribType] === undefined) {
    return true
  }

  return scalarIntersects(folder.attrib[filterType as keyof FolderAttribType], filterValues)
}

// TODO: do not use recursion here
const isMatchingFolderFilters = (folder: MatchingFolder, filtersMap: Map<string, $Any[]>) => {
  for (const [filter, values] of filtersMap.entries()) {
    if (
      !isMatchingFolderFilter(
        //@ts-ignore
        folder,
        filter as keyof FolderNode | keyof FolderAttribType,
        values,
      )
    ) {
      return false
    }
  }

  return true
}

const isMatchingTaskFilter = (task: EditorTaskNode, filterType: string, filterValues: string[]) => {
  if (strongFilters.includes(filterType)) {
    return listsIntersect(task[filterType as keyof EditorTaskNode], filterValues)
  }

  return scalarIntersects(task.attrib[filterType as keyof TaskAttribType], filterValues)
}

const isMatchingTaskFilters = (task: EditorTaskNode, filtersMap: $Any) => {
  for (const filter in filtersMap) {
    if (!isMatchingTaskFilter(task, filter, filtersMap[filter])) {
      return false
    }
  }

  return true
}

const listsIntersect = (listA: string[], listB: string[]) => {
  if (listA === undefined) {
    return false
  }
  for (const value of listB) {
    if (listA.includes(value)) {
      return true
    }
  }
  return false
}

const scalarIntersects = (value: string, listB: string[]) => {
  if (listB.includes(value)) {
    return true
  }
  return false
}
