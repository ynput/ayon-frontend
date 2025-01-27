//@ts-nocheck
import { Filter } from '@components/SearchFilter/types'
import formatSearchQueryFilters, {
  FilterQueriesData,
} from '@containers/TasksProgress/helpers/formatSearchQueryFilters'
import { TaskFilterValue } from '@containers/TasksProgress/hooks/useFilterBySlice'
import { $Any } from '@types'
import { FolderListItem } from '@api/rest/folders'
import { TableRow } from './types'

const getAbsoluteSelections = (selections: $Any) =>
  selections.map((selection: $Any) => ({
    start: [
      Math.min(selection?.start?.[0] || -1, selection.end?.[0] || -1),
      Math.min(selection?.start?.[1] || -1, selection.end?.[1] || -1),
    ],
    end: [
      Math.max(selection?.start?.[0] || -1, selection.end?.[0] || -1),
      Math.max(selection?.start?.[1] || -1, selection.end?.[1] || -1),
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
  folderTypes,
  taskTypes,
}: {
  allFolders: FolderListItem[]
  folders: $Any
  tasks: $Any
  folderTypes: $Any
  taskTypes: $Any
}) => {
  let mappedRawData = {}
  allFolders.forEach((element) => {
    mappedRawData[element.id] = element
  })

  let mappedTaskData = {}
  Object.values(tasks).forEach((element) => {
    mappedTaskData[element.folderId] = {
      ...mappedTaskData[element.folderId],
      [element.id]: element,
    }
  })

  let mappedFolderData = {}
  Object.values(folders).forEach((element) => {
    mappedFolderData[element.parentId] = {
      ...mappedFolderData[element.parentId],
      [element.id]: element,
    }
  })

  let mergedData = {}
  return createDataTree({
    allFolders,
    folderTypes,
    taskTypes,
    mappedRowData: mappedRawData,
    tasks: mappedTaskData,
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

const createDataTree = <T extends FolderListItem>({
  allFolders,
  mappedRawData,
  folderTypes,
  taskTypes,
  folders,
  tasks,
  rawFolders,
  rawTasks
}): { hashedData: Map<String, TableRow>; tableData: TableRow[] } => {

  let hashedData = new Map<string, TableRow>()
  let dataTree: TableRow[] = []
  let taskPlaceholders: {[key: string]: TableRow[]} = {}

  const matchedFolderIds = Object.keys(rawFolders)

  const matchedTaskIds = Object.keys(rawTasks)
  const matchedIds = [...matchedFolderIds, ...matchedTaskIds ]

  // sort folders by name
  let sortedItems = [...allFolders]
  sortedItems = sortedItems.filter(el => matchedIds.includes(el.id))
  sortedItems = sortedItems.sort((a, b) =>
    (a.label || a.name).localeCompare(b.label || b.name),
  )

  // Single pass to create base rows and store in Map
  for (let i = 0; i < sortedItems.length; i++) {
    const item = sortedItems[i]
    const id = item['id'] as string
    // @ts-ignore
    const row: TableRow = {
      // @ts-ignore
      ...(item.data ? item : folderToTableRow(folderTypes, item)),
      subRows: [],
    }
    hashedData.set(id, row)
    if (!item.hasTasks) {
      continue
    }

    let sortedTaskNames = Array.from(item.taskNames)
    sortedTaskNames = sortedTaskNames.sort((a, b) => a.localeCompare(b))
    for (const taskName of sortedTaskNames) {
      taskPlaceholders = {
        ...taskPlaceholders,
        [item.id] : [
          ...taskPlaceholders[item.id] || [],
          placeholderToTableRow(taskName, item)
        ]
      }
    }
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

  let folderMap = {}
  for (const parentId in folders) {
    for (const folderId in folders[parentId]) {
      folderMap[parentId] = {
        ...folderMap[parentId],
        [folderId]: folderToTableRow(folderTypes, folders[parentId][folderId], parentId),
      }
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


export { getAbsoluteSelections, isSelected, mapQueryFilters, populateTableData }
