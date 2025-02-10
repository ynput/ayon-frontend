import { $Any } from '@types'
import { FolderListItem } from '@api/rest/folders'
import { TableRow } from '../types'

const entityToRowMappers = (folderTypes: $Any, taskTypes: $Any) => {
  const getFolderIcon = (type: string) => {
    return folderTypes[type]?.icon || 'folder'
  }

  const getTaskIcon = (type: string) => {
    return taskTypes[type].icon || 'folder'
  }

  function taskToTableRow(
    task: $Any,
    parentId: string,
  ): Omit<TableRow, 'subRows'> & { matchesFilters: boolean } {
    return {
      id: task.id,
      parentId,
      name: task.name,
      matchesFilters: task.matchesFilters,
      label: task.label || task.name,
      icon: getTaskIcon(task.taskType),
      img: null,
      data: {
        id: task.id,
        type: 'task',
        name: task.name,
        label: task.label || task.name,
      },
    }
  }

  const folderToTableRow = (
    folder: FolderListItem & { matchesFilters: boolean },
  ): Omit<TableRow, 'subRows'> & { matchesFilters: boolean } => {
    return {
      id: folder.id,
      matchesFilters: folder.matchesFilters,
      parentId: folder.parentId,
      name: folder.name,
      label: folder.label || folder.name,
      icon: getFolderIcon(folder.folderType),
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
        type: 'task',
        name: taskName,
        label: taskName,
      },
    }
  }

  return {
    taskToTableRow,
    folderToTableRow,
    placeholderToTableRow,
  }
}

export default entityToRowMappers
