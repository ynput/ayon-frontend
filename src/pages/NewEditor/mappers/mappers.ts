import { TaskNode } from '@api/graphql'
import { FolderListItem } from '@api/rest/folders'
import { Filter } from '@components/SearchFilter/types'
import formatSearchQueryFilters, {
  FilterQueriesData,
} from '@containers/TasksProgress/helpers/formatSearchQueryFilters'
import { TaskFilterValue } from '@containers/TasksProgress/hooks/useFilterBySlice'
import { $Any } from '@types'
import { FolderNodeMap, MatchingFolder, TableRow, TaskNodeMap } from '../types'

const getAbsoluteSelections = (selections: $Any) =>
  selections.map((selection: $Any) => ({
    start: [
      Math.min(selection?.start?.[0] ?? -1, selection.end?.[0] ?? -1),
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
  isFlatList,
  entityToRowMappers,
}: {
  allFolders: FolderListItem[]
  folders: FolderNodeMap
  tasks: Map<string, Partial<TaskNode>>
  taskList: Partial<TaskNode>[]
  isFlatList: boolean
  entityToRowMappers: $Any
}) => {
  let mappedRawData: FolderNodeMap = {}
  allFolders.forEach((element) => {
    mappedRawData[element.id] = {
      ...element,
      matchesFilters: folders[element.id]?.matchesFilters || false,
    }
  })

  let mappedTaskData: { [key: string]: TaskNodeMap } = {}
  tasks.forEach((element) => {
    if (mappedTaskData[element.folderId as string] === undefined) {
      mappedTaskData[element.folderId as string] = {}
    }
    mappedTaskData[element.folderId as string][element.id as string] = element as TaskNode
  })

  let mappedFolderData: { [key: string]: FolderNodeMap } = {}
  Object.values(folders).forEach((element) => {
    if (mappedFolderData[element.parentId as string] === undefined) {
      mappedFolderData[element.parentId as string] = {}
    }
    mappedFolderData[element.parentId as string][element.id as string] = element as MatchingFolder
  })

  return isFlatList
    ? createFlatList({
        allFolders,
        tasks: mappedTaskData,
        taskList,
        rawFolders: folders,
        rawTasks: tasks,
        entityToRowMappers,
      })
    : createDataTree({
        allFolders,
        mappedRawData,
        tasks: mappedTaskData,
        taskList,
        folders: mappedFolderData,
        rawFolders: folders,
        rawTasks: tasks,
        entityToRowMappers,
      })
}

const createFlatList = ({
  allFolders,
  tasks,
  taskList,
  rawFolders,
  rawTasks,
  entityToRowMappers,
}: {
  allFolders: $Any
  tasks: $Any
  taskList: $Any
  rawFolders: $Any
  rawTasks: $Any
  entityToRowMappers: $Any
}): { hashedData: Map<String, TableRow>; tableData: TableRow[] } => {
  let hashedData = new Map<string, TableRow>()
  let flatList: TableRow[] = []

  const matchedFolderIds = Object.keys(rawFolders)

  const matchedTaskIds = Object.keys(rawTasks)
  const matchedIds = [...matchedFolderIds, ...matchedTaskIds]

  // sort folders by name
  let sortedItems = [...allFolders]
  sortedItems = sortedItems.filter((el) => matchedIds.includes(el.id))
  sortedItems = sortedItems.sort((a, b) => (a.label || a.name).localeCompare(b.label || b.name))

  let taskMap: TaskNodeMap = {}
  for (const parentId in tasks) {
    for (const taskId in tasks[parentId]) {
      taskMap[parentId] = {
        ...taskMap[parentId],
        [taskId]: entityToRowMappers.taskToTableRow(tasks[parentId][taskId], parentId),
      }
    }
  }

  let taskTableRowList = []
  for (const task of taskList) {
    taskTableRowList.push(entityToRowMappers.taskToTableRow(task, task.folderId))
  }

  for (const task of taskTableRowList) {
    flatList.push(task)
  }

  return { hashedData, tableData: flatList }
}

const createDataTree = ({
  allFolders,
  mappedRawData,
  folders,
  tasks,
  taskList,
  rawFolders,
  rawTasks,
  entityToRowMappers,
}: {
  allFolders: $Any
  mappedRawData: $Any
  folders: $Any
  tasks: $Any
  taskList: $Any
  rawFolders: $Any
  rawTasks: $Any
  entityToRowMappers: $Any
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
    const id = item.id
    // @ts-ignore
    const row: TableRow = {
      // @ts-ignore
      ...(item.data ? item : entityToRowMappers.folderToTableRow(mappedRawData[id])),
      subRows: [],
    }
    hashedData.set(id, row)
    if (!item.hasTasks) {
      continue
    }

    let sortedTaskNames = Array.from(item.taskNames)
    sortedTaskNames = (sortedTaskNames as string[]).sort((a, b) => a.localeCompare(b))

    for (const taskName of sortedTaskNames) {
      taskPlaceholders = {
        ...taskPlaceholders,
        [item.id]: [
          ...(taskPlaceholders[item.id] || []),
          entityToRowMappers.placeholderToTableRow(taskName, item),
        ],
      }
    }
  }

  let taskMap: { [key: string]: { [key: string]: TableRow } } = {}
  for (const parentId in tasks) {
    for (const taskId in tasks[parentId]) {
      taskMap[parentId] = {
        ...taskMap[parentId],
        [taskId]: entityToRowMappers.taskToTableRow(tasks[parentId][taskId], parentId),
      }
    }
  }

  let taskTableRowList = []
  for (const task of taskList) {
    taskTableRowList.push(entityToRowMappers.taskToTableRow(task, task.folderId))
  }

  let folderMap: { [key: string]: { [key: string]: TableRow } } = {}
  for (const parentId in folders) {
    for (const folderId in folders[parentId]) {
      if (folderMap[parentId] === undefined) {
        folderMap[parentId] = {}
      }

      folderMap[parentId][folderId] = entityToRowMappers.folderToTableRow(
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
          parentRow.subRows.unshift({ ...row, subRows: original?.subRows || [] })
        }
      } else {
        // dataTree.push(row)
      }
    }
  }

  return { hashedData, tableData: dataTree }
}

export { getAbsoluteSelections, isSelected, mapQueryFilters, populateTableData }
