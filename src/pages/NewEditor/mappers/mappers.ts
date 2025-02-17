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
  expanded,
}: {
  allFolders: FolderListItem[]
  folders: FolderNodeMap
  tasks: Map<string, Partial<TaskNode>>
  taskList: Partial<TaskNode>[]
  isFlatList: boolean
  entityToRowMappers: $Any
  expanded: Record<string, boolean>
}) => {
  const foldersVisible = allFolders.filter(
    (folder) => !folder.parentId || expanded[folder.parentId],
  )
  // console.time('mappedRawData')
  // 1ms
  let mappedRawData: FolderNodeMap = {}
  foldersVisible.forEach((element) => {
    mappedRawData[element.id] = {
      ...element,
      matchesFilters: folders[element.id]?.matchesFilters || false,
    }
  })
  // console.timeEnd('mappedRawData')

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

  // return { hashedData: new Map<string, TableRow>(), tableData: [] }

  console.time('populateTableData')
  const tableData = isFlatList
    ? createFlatList({
        allFolders,
        tasks: mappedTaskData,
        taskList,
        rawFolders: folders,
        rawTasks: tasks,
        entityToRowMappers,
      })
    : createDataTree({
        allFolders: foldersVisible,
        mappedRawData,
        tasks: mappedTaskData,
        rawFolders: folders,
        rawTasks: tasks,
        entityToRowMappers,
      })

  console.timeEnd('populateTableData')

  // console.log(tableData)

  return tableData
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
  tasks,
  rawFolders,
  rawTasks,
  entityToRowMappers,
}: {
  allFolders: $Any
  mappedRawData: $Any
  tasks: $Any
  rawFolders: $Any
  rawTasks: $Any
  entityToRowMappers: $Any
}): { hashedData: Map<String, TableRow>; tableData: TableRow[] } => {
  const hashedData = new Map<string, TableRow>()
  const dataTree: TableRow[] = []

  // 1. Create efficient lookup maps
  const matchedIds = new Set([...Object.keys(rawFolders), ...Object.keys(rawTasks)])
  const taskLookup = new Map(Object.entries(tasks))

  // 2. Pre-sort and filter allFolders in one pass
  const sortedItems = allFolders
    .filter((el) => matchedIds.has(el.id))
    .sort((a, b) => (a.label || a.name).localeCompare(b.label || b.name))

  // 3. Create a parentId lookup map for faster relationship building
  const parentIdMap = new Map<string, TableRow[]>()

  // 4. Single pass to create base rows and organize by parentId
  for (const item of sortedItems) {
    const row: TableRow = item.data
      ? item
      : entityToRowMappers.folderToTableRow(mappedRawData[item.id])
    row.subRows = []
    hashedData.set(item.id, row)

    if (item.parentId) {
      const children = parentIdMap.get(item.parentId) || []
      children.push(row)
      parentIdMap.set(item.parentId, children)
    } else {
      dataTree.push(row)
    }

    // Handle tasks inline if present
    if (item.hasTasks && item.taskNames) {
      const taskRows = new Map<string, TableRow>()

      // Add placeholders
      Array.from(item.taskNames)
        .sort((a, b) => a.localeCompare(b))
        .forEach((taskName) => {
          const placeholder = entityToRowMappers.placeholderToTableRow(taskName, item)
          taskRows.set(taskName, placeholder)
        })

      // Override with actual tasks if they exist
      const itemTasks = taskLookup.get(item.id)
      if (itemTasks) {
        for (const [taskId, task] of Object.entries(itemTasks)) {
          const taskRow = entityToRowMappers.taskToTableRow(task, item.id)
          taskRows.set(taskRow.name, taskRow)
        }
      }

      // Add tasks to subRows in sorted order
      row.subRows = Array.from(taskRows.values())
    }
  }

  // 5. Build relationships in a single pass using parentIdMap
  for (const [parentId, children] of parentIdMap) {
    const parentRow = hashedData.get(parentId)
    if (parentRow) {
      // Add folder children
      parentRow.subRows.push(...children)

      // Sort all subRows by name
      parentRow.subRows.sort((a, b) => a.name.localeCompare(b.name))
    }
  }

  return { hashedData, tableData: dataTree }
}

export { getAbsoluteSelections, isSelected, mapQueryFilters, populateTableData }
