import { Filter } from '@components/SearchFilter/types'
import { TaskFilterValue } from '@containers/TasksProgress/hooks/useFilterBySlice'
import { $Any } from '@types'
import { FolderListItem } from '@api/rest/folders'
import { FolderNodeMap, MatchingFolder, TaskNodeMap } from '../types'
import { FolderAttribType, FolderNode, TaskAttribType, TaskNode } from '@api/graphql'
import getFilterFromId from '@components/SearchFilter/getFilterFromId'
import { listsIntersect, scalarIntersects } from './listHelpers'

const getFilteredEntities = ({
  folders,
  tasks,
  tasksFolders = [],
  filters,
}: {
  allFolders: FolderListItem[]
  folders: FolderNodeMap
  tasks: TaskNodeMap
  tasksFolders: string[]
  filters: Filter[]
  sliceFilter: TaskFilterValue | null
}): {
  folders: { [key: string]: Partial<FolderNode> }
  tasks: Map<string, TaskNode>
  taskList: Partial<TaskNode>[]
} => {
  const filtersMap = getFiltersMap(filters)

  const filteredFolders = getFilteredFolders(folders, filters, filtersMap)

  const filteredTasksList = Object.values(getFilteredTasks(tasks, filters, filtersMap))

  // TODO check why this is failing...
  // filteredTasksList.sort(taskListSorter)
  const filteredTasks = filteredTasksList.reduce((acc: Map<string, Partial<TaskNode>>, task) => {
    acc.set(task.id, task)
    return acc
  }, new Map())

  const paths: string[] = []
  for (const id of tasksFolders) {
    if (folders[id] === undefined) {
      continue
    }

    paths.push(folders[id].path!)
  }

  const splitPaths = []
  for (const path of paths) {
    let tmpPath = []
    for (const pathToken of path.split('/')) {
      tmpPath.push(pathToken)
      splitPaths.push(tmpPath.join('/'))
    }
  }

  const treeFolders: FolderNodeMap = {}
  const filteredFolderIds = Object.keys(filteredFolders)
  for (const id in folders) {
    if (splitPaths.includes(folders[id].path!)) {
      treeFolders[id] = {
        ...folders[id],
        // TODO check if this still applies...
        matchesFilters: Object.keys(filtersMap).length == 0 || filteredFolderIds.includes(id),
      }
    }
  }

  return { folders: treeFolders, tasks: filteredTasks, taskList: filteredTasksList }
}

const strongFilters = ['assignees']

const getFiltersMap = (filters: Filter[]) => {
  return filters.reduce((filtersAcc: { [key: string]: $Any[] }, filter: Filter) => {
    filtersAcc[getFilterFromId(filter.id)] = (filter.values ?? []).reduce(
      (acc2: $Any[], filterValue) => {
        if (filter.type === 'integer') {
          acc2.push(parseInt(filterValue.id))
        }
        if (filter.type === 'float') {
          acc2.push(parseFloat(filterValue.id))
        }
        if (filter.type === 'string') {
          acc2.push(filterValue.id)
        }
        if (filter.type === 'list_of_strings') {
          acc2.push(filterValue.id)
        }

        return acc2
      },
      [],
    )
    return filtersAcc
  }, {})
}

const getFilteredFolders = (
  folders: FolderNodeMap,
  filters: $Any,
  filtersMap: { [key: string]: string[] },
): FolderNodeMap => {
  if (!filters) {
    return folders
  }

  let filteredFolders: FolderNodeMap = {}
  let first = true
  for (const id in folders) {
    if (first) {
      first = false
    }
    if (isMatchingFolderFilters(folders[id], filtersMap)) {
      filteredFolders[id] = folders[id]
    }
  }
  return filteredFolders
}

const getFilteredTasks = (
  tasks: TaskNodeMap,
  filters: $Any,
  filtersMap: { [key: string]: string[] },
): TaskNodeMap => {
  if (!filters) {
    return tasks
  }

  let filteredTasks: TaskNodeMap = {}
  let first = true
  for (const id in tasks) {
    if (first) {
      first = false
    }
    if (isMatchingTaskFilters(tasks[id], filtersMap)) {
      filteredTasks[id] = {
        ...tasks[id],
      }
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

const isMatchingFolderFilters = (
  folder: MatchingFolder,
  filtersMap: { [key: string]: string[] },
) => {
  for (const filter in filtersMap) {
    if (
      !isMatchingFolderFilter(
        //@ts-ignore
        folder,
        filter as keyof FolderNode | keyof FolderAttribType,
        filtersMap[filter],
      )
    ) {
      return false
    }
  }

  return true
}

const isMatchingTaskFilter = (task: TaskNode, filterType: string, filterValues: string[]) => {
  if (strongFilters.includes(filterType)) {
    return listsIntersect(task[filterType as keyof TaskNode], filterValues)
  }

  return scalarIntersects(task.attrib[filterType as keyof TaskAttribType], filterValues)
}

const isMatchingTaskFilters = (task: TaskNode, filtersMap: $Any) => {
  for (const filter in filtersMap) {
    if (!isMatchingTaskFilter(task, filter, filtersMap[filter])) {
      return false
    }
  }

  return true
}

export { getFilteredEntities }
