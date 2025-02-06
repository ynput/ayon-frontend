//@ts-nocheck
import { Filter } from '@components/SearchFilter/types'
import formatSearchQueryFilters, {
  FilterQueriesData,
} from '@containers/TasksProgress/helpers/formatSearchQueryFilters'
import { TaskFilterValue } from '@containers/TasksProgress/hooks/useFilterBySlice'
import { $Any } from '@types'
import { FolderListItem } from '@api/rest/folders'
import { TableRow } from './types'
import { FolderNode, TaskNode } from '@api/graphql'
import getFilterFromId from '@components/SearchFilter/getFilterFromId'
import { match } from 'assert'
import { matchesFilterKeys } from '@containers/SettingsEditor/FormTemplates/searchMatcher'
import { SortByOption } from '@pages/UserDashboardPage/UserDashboardTasks/DashboardTasksToolbar/KanBanSortByOptions'

const getAbsoluteSelections = (selections: $Any) =>
  selections.map((selection: $Any) => ({
    start: [
      Math.min(selection?.start?.[0]  ?? -1, selection.end?.[0] ?? -1),
      Math.min(selection?.start?.[1] ?? -1, selection.end?.[1] ?? -1),
    ],
    end: [
      Math.max(selection?.start?.[0] ?? -1, selection.end?.[0] ?? -1),
      Math.max(selection?.start?.[1] ?? -1, selection.end?.[1] ?? -1),
    ],
  })) as Selection[]

const isSelected = (absoluteSelections: $Any, x: number, y: number) => {
  for (const selection of absoluteSelections) {
    if (selection.start === undefined || selection.end === undefined) {
      continue
    }
    if (
      selection.start[0] <= x &&
      x <= selection.end[0] &&
      selection.start[1] <= y &&
      y <= selection.end[1]
    ) {
      return true
    }
  }

  return false
}

type QueryFiltersParams = {
  filters: Filter[]
  sliceFilter: TaskFilterValue | null
  selectedPaths?: string[]
}

const mapQueryFilters = ({ filters, sliceFilter, selectedPaths = [] }: QueryFiltersParams) => {
  const queryFilters = formatSearchQueryFilters(filters, sliceFilter) as FilterQueriesData & {
    pathEx: string
  }
  if (selectedPaths.length > 0) {
    queryFilters.pathEx = selectedPaths.join('|')
  }

  return queryFilters
}

const populateTableData = ({
  allFolders,
  folders,
  tasks,
  taskList,
  folderTypes,
  taskTypes,
  isFlatList,
}: {
  allFolders: FolderListItem[]
  folders: Map<Partial<FolderNode>>
  tasks: Map<Partial<TaskNode>>
  taskList: Partial<TaskNode>[]
  folderTypes: $Any
  taskTypes: $Any
  isFlatList: boolean
}) => {
  let mappedRawData = {}
  allFolders.forEach((element) => {
    mappedRawData[element.id] = {
      ...element,
      matchesFilters: folders[element.id]?.matchesFilters || false,
    }
  })

  let mappedTaskData = {}
  tasks.forEach((element, key, map) => {
    if (mappedTaskData[element.folderId] === undefined) {
      mappedTaskData[element.folderId] = {}
    }
    mappedTaskData[element.folderId][element.id] = element
  })

  let mappedFolderData = {}
  Object.values(folders).forEach((element) => {
    if (mappedFolderData[element.parentId] === undefined) {
      mappedFolderData[element.parentId] = {}
    }
    mappedFolderData[element.parentId][element.id] = element
  })

  let mergedData = {}
  return isFlatList
    ? createFlatList({
        allFolders,
        folderTypes,
        taskTypes,
        mappedRawData,
        tasks: mappedTaskData,
        taskList,
        folders: mappedFolderData,
        rawFolders: folders,
        rawTasks: tasks,
      })
    : createDataTree({
        allFolders,
        folderTypes,
        taskTypes,
        mappedRawData,
        tasks: mappedTaskData,
        taskList,
        folders: mappedFolderData,
        rawFolders: folders,
        rawTasks: tasks,
      })
}

const getFolderIcon = (folderTypes: $Any, type: string) => {
  return folderTypes[type]?.icon || 'folder'
}

const getTaskIcon = (taskTypes: $Any, type: string) => {
  return taskTypes[type].icon || 'folder'
}

function taskToTableRow(taskTypes: $Any, task: $Any, parentId): Omit<TableRow, 'subRows'> {
  return {
    id: task.id,
    parentId,
    name: task.name,
    matchesFilters: task.matchesFilters,
    label: task.label || task.name,
    icon: getTaskIcon(taskTypes, task.taskType),
    img: null,
    data: {
      id: task.id,
      type: 'task',
      name: task.name,
      label: task.label || task.name,
    },
  }
}

const folderToTableRow = (folderTypes: $Any, folder: FolderListItem): Omit<TableRow, 'subRows'> => {
  return {
    id: folder.id,
    matchesFilters: folder.matchesFilters,
    parentId: folder.parentId,
    name: folder.name,
    label: folder.label || folder.name,
    icon: getFolderIcon(folderTypes, folder.folderType),
    img: null,
    data: {
      id: folder.id,
      type: 'folder',
      name: folder.name,
      label: folder.label || folder.name,
      subType: folder.folderType,
    },
  }
}

const placeholderToTableRow = (
  taskName: string,
  parentFolder: FolderListItem,
): Omit<TableRow, 'subRows'> => {
  return {
    id: parentFolder.id + '-' + taskName,
    parentId: parentFolder.id,
    name: taskName,
    label: taskName,
    icon: '',
    img: null,
    data: {
      id: parentFolder.id,
      type: 'folder',
      name: taskName,
      label: taskName,
    },
  }
}

const createFlatList = <T extends FolderListItem>({
  allFolders,
  mappedRawData,
  folderTypes,
  taskTypes,
  folders,
  tasks,
  taskList,
  rawFolders,
  rawTasks,
}): { hashedData: Map<String, TableRow>; tableData: TableRow[] } => {
  let hashedData = new Map<string, TableRow>()
  let dataTree: TableRow[] = []
  let taskPlaceholders: { [key: string]: TableRow[] } = {}

  const matchedFolderIds = Object.keys(rawFolders)

  const matchedTaskIds = Object.keys(rawTasks)
  const matchedIds = [...matchedFolderIds, ...matchedTaskIds]

  // sort folders by name
  let sortedItems = [...allFolders]
  sortedItems = sortedItems.filter((el) => matchedIds.includes(el.id))
  sortedItems = sortedItems.sort((a, b) => (a.label || a.name).localeCompare(b.label || b.name))

  let taskMap = {}
  for (const parentId in tasks) {
    for (const taskId in tasks[parentId]) {
      taskMap[parentId] = {
        ...taskMap[parentId],
        [taskId]: taskToTableRow(taskTypes, tasks[parentId][taskId], parentId),
      }
    }
  }

  let taskTableRowList = []
  for (const task of taskList) {
    taskTableRowList.push(taskToTableRow(taskTypes, task, task.folderId))
  }

  let folderMap = {}

  for (const task of taskTableRowList) {
    dataTree.push(task)
  }

  return { hashedData, tableData: dataTree }
}

const createDataTree = <T extends FolderListItem>({
  allFolders,
  mappedRawData,
  folderTypes,
  taskTypes,
  folders,
  tasks,
  taskList,
  rawFolders,
  rawTasks,
}): { hashedData: Map<String, TableRow>; tableData: TableRow[] } => {
  let hashedData = new Map<string, TableRow>()
  let dataTree: TableRow[] = []
  let taskPlaceholders: { [key: string]: TableRow[] } = {}

  const matchedFolderIds = Object.keys(rawFolders)

  const matchedTaskIds = Object.keys(rawTasks)
  const matchedIds = [...matchedFolderIds, ...matchedTaskIds]

  // sort folders by name
  let sortedItems = [...allFolders]
  sortedItems = sortedItems.filter((el) => matchedIds.includes(el.id))
  sortedItems = sortedItems.sort((a, b) => (a.label || a.name).localeCompare(b.label || b.name))

  // Single pass to create base rows and store in Map
  for (let i = 0; i < sortedItems.length; i++) {
    const item = sortedItems[i]
    const id = item['id'] as string
    // @ts-ignore
    const row: TableRow = {
      // @ts-ignore
      ...(item.data ? item : folderToTableRow(folderTypes, mappedRawData[id])),
      subRows: [],
    }
    hashedData.set(id, row)
    if (!item.hasTasks) {
      continue
    }

    let sortedTaskNames = Array.from(item.taskNames)
    sortedTaskNames = sortedTaskNames.sort((a, b) => a.localeCompare(b))

    // TODO check if placeholders are actually needed (might be when fetching by parentd ID when no filters are in place)
    /*
    for (const taskName of sortedTaskNames) {
      taskPlaceholders = {
        ...taskPlaceholders,
        [item.id]: [...(taskPlaceholders[item.id] || []), placeholderToTableRow(taskName, item)],
      }
    }
      */
  }

  let taskMap = {}
  for (const parentId in tasks) {
    for (const taskId in tasks[parentId]) {
      taskMap[parentId] = {
        ...taskMap[parentId],
        [taskId]: taskToTableRow(taskTypes, tasks[parentId][taskId], parentId),
      }
    }
  }

  let taskTableRowList = []
  for (const task of taskList) {
    taskTableRowList.push(taskToTableRow(taskTypes, task, task.folderId))
  }

  let folderMap = {}
  for (const parentId in folders) {
    for (const folderId in folders[parentId]) {
      if (folderMap[parentId] === undefined) {
        folderMap[parentId] = {}
      }

      folderMap[parentId][folderId] = folderToTableRow(
        folderTypes,
        folders[parentId][folderId],
        parentId,
      )
    }
  }

  // Single pass to build relationships
  for (let i = 0; i < sortedItems.length; i++) {
    const item = sortedItems[i]
    const id = item['id'] as string
    const parentId = item['parentId'] as string
    const row = hashedData.get(id)!

    if (parentId && hashedData.has(parentId)) {
      const parentRow = hashedData.get(parentId)
      if (parentRow) {
        parentRow.subRows.push(row)
      }
    } else {
      dataTree.push(row)
    }
  }

  // Iterating tasks
  for (const parentId in taskPlaceholders) {
    // @ts-ignore
    for (const task of taskPlaceholders[parentId]) {
      if (hashedData.get(parentId!)?.subRows.find((e: $Any) => e.name == task.name)) {
        continue
      }
      hashedData.get(parentId!)?.subRows.push(task)
    }
  }

  for (const parentId in taskMap) {
    for (const taskId in taskMap[parentId]) {
      const item = taskMap[parentId][taskId]

      if (parentId && hashedData.has(parentId)) {
        const parentRow = hashedData.get(parentId)
        if (parentRow) {
          parentRow.subRows = parentRow.subRows.filter((el) => el.name !== item.name)
          parentRow.subRows.unshift(item)
        }
      }
    }
    hashedData.get(parentId)?.subRows.sort((a, b) => a.name.localeCompare(b.name))
  }

  for (const parentId in folderMap) {
    for (const folderId in folderMap[parentId]) {
      const item = folderMap[parentId][folderId]
      const row = folderMap[parentId][folderId]

      if (parentId && hashedData.has(parentId)) {
        const parentRow = hashedData.get(parentId)
        if (parentRow) {
          const original = parentRow.subRows.find((el) => el.name === item.name)
          parentRow.subRows = parentRow.subRows.filter((el) => el.name !== item.name)
          parentRow.subRows.unshift({ ...row, subRows: original?.subRows })
        }
      } else {
        // dataTree.push(row)
      }
    }
  }

  return { hashedData, tableData: dataTree }
}

const getFilteredEntities = ({
  allFolders,
  folders,
  tasks,
  tasksFolders = [],
  filters,
  sliceFilter,
  sortBy,
}: {
  allFolders: FolderListItem[]
  folders: { [key: string]: FolderNode }
  tasks: { [key: string]: Partial<TaskNode> }
  tasksFolders: string[]
  filters: Filter[]
  sliceFilter: TaskFilterValue | null
  sortBy: SortByOption[]
}): {
  folders: { [key: string]: FolderNode }
  tasks: { [key: string]: Partial<TaskNode> }
  taskList: Partial<TaskNode>[]
} => {


  const filtersMap = getFiltersMap(filters)

  const filteredFolders = getFilteredFolders(folders, filters, filtersMap)

  const filteredTasksList = Object.values(getFilteredTasks(tasks, filters, filtersMap))
  // TODO fetch attributes and use actual project values instead of hard coded ones
  const priorityWeight = { low: 1, normal: 10, high: 100, urgent: 1000 }

  filteredTasksList.sort(taskListSorter)
  const filteredTasks = filteredTasksList.reduce((acc: Map<Partial<Task>>, task) => {
    acc.set(task.id, task)
    return acc
  }, new Map())

  const paths = []
  for (const id of tasksFolders) {
    paths.push(folders[id].path)
  }

  const splitPaths = []
  for (const path of paths) {
    let tmpPath = []
    for (const pathToken of path.split('/')) {
      tmpPath.push(pathToken)
      splitPaths.push(tmpPath.join('/'))
    }
  }

  const treeFolders = {}
  const filteredFolderIds = Object.keys(filteredFolders)
  for (const id in folders) {
    if (splitPaths.includes(folders[id].path)) {
      treeFolders[id] = {
        ...folders[id],
        matchesFilters: Object.keys(filtersMap).length == 0 || filteredFolderIds.includes(id),
      }
    }
  }

  return { folders: treeFolders, tasks: filteredTasks, taskList: filteredTasksList }
}

const strongFilters = ['folderType', 'status', 'assignees']

const getFiltersMap = (filters: Filter[]) => {
  return filters.reduce((filtersAcc, filter: Filter) => {
    filtersAcc[getFilterFromId(filter.id)] = filter.values.reduce((acc2, filterValue) => {
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
    }, [])
    return filtersAcc
  }, {})
}

const getFilteredFolders = (
  folders: FolderNode[],
  filters: $Any,
  filtersMap: { [key: string]: string[] },
) => {
  if (!filters) {
    return folders
  }

  let filteredFolders = {}
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
  tasks: TaskNode[],
  filters: $Any,
  filtersMap: { [key: string]: string[] },
): TaskNode[] => {
  if (!filters) {
    return tasks
  }

  let filteredTasks = {}
  let first = true
  for (const id in tasks) {
    if (first) {
      first = false
    }
    if (isMatchingTaskFilters(tasks[id], filtersMap)) {
      filteredTasks[id] = {
        ...tasks[id],
        matchesFilters: true,
      }
    }
  }
  return filteredTasks
}

const taskListSorter = (a, b) => {
  let result = 0
  // TODO Check if statuses have cardinality also - see priorities
  for (const sortOrder of sortBy) {
    if (sortOrder.id === 'status') {
      result = a.status.localeCompare(b.status) * (sortOrder.sortOrder ? 1 : -1)
      if (result !== 0) {
        return result
      }
    }
    if (sortOrder.id === 'label') {
      result =
        (a.label || a.name).localeCompare(b.label || a.name) * (sortOrder.sortOrder ? 1 : -1)
      if (result !== 0) {
        return result
      }
    }
    if (sortOrder.id === 'priority') {
      result =
        (priorityWeight[b.attrib.priority] - priorityWeight[a.attrib.priority]) *
        (sortOrder.sortOrder ? 1 : -1)
      if (result !== 0) {
        return result
      }
    }
  }

  return result
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

const isMatchingFolderFilter = (
  folder: FolderNode,
  filterType: string,
  filterValues: string[],
) => {
  if (strongFilters.includes(filterType)) {
    // some filters are task specific and should be ignored for folders
    if (folder[filterType] === undefined) {
      return false
    }
    return listsIntersect(folder[filterType], filterValues)
  }

  // some filters are task specific and should be ignored for folders
  if (folder.attrib[filterType] === undefined) {
    return true
  }

  return scalarIntersects(folder.attrib[filterType], filterValues)
}

const isMatchingFolderFilters = (folder: FolderNode, filtersMap: { [key: string]: string[] }) => {
  for (const filter in filtersMap) {
    if (!isMatchingFolderFilter(folder, filter, filtersMap[filter])) {
      return false
    }
  }

  return true
}

const isMatchingTaskFilter = (task: TaskNode, filterType: string, filterValues: string[]) => {
  if (strongFilters.includes(filterType)) {
    return listsIntersect(task[filterType], filterValues)
  }

  return scalarIntersects(task.attrib[filterType], filterValues)
}

const isMatchingTaskFilters = (task: TaskNode) => {
  for (const filter in filtersMap) {
    if (!isMatchingTaskFilter(task, filter, filtersMap[filter])) {
      return false
    }
  }

  return true
}


export {
  getAbsoluteSelections,
  isSelected,
  mapQueryFilters,
  populateTableData,
  getFilteredEntities,
}
