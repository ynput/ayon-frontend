// create table data for the hierarchy
import { useGetFolderListQuery } from '@queries/getHierarchy'
import { useEffect, useMemo, useState } from 'react'
import { FolderListItem } from '@api/rest/folders'
import { ExpandedState } from '@tanstack/react-table'
import { useGetExpandedBranchQuery } from '@queries/editor/getEditor'
import { $Any } from '@types'
import { TableRow } from '@ynput/ayon-react-components'

export type TableRow = {
  id: string
  parentId?: string
  name: string
  label: string
  icon?: string | null
  iconColor?: string
  img?: string | null
  startContent?: JSX.Element
  subRows: TableRow[]
  data: ExtraData
}

export type ExtraData = {
  id: string
  type: string
  name?: string | null
  label?: string | null
  subType?: string | null
}

type Props = {
  projectName: string | null
  folderTypes: $Any
  taskTypes: $Any
}

const useExtendedHierarchyTable = ({ projectName, folderTypes, taskTypes }: Props) => {
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [itemExpanded, setItemExpanded] = useState<string>('root')
  const [extraData, setExtraData] = useState({})

  let {
    status,
    data: branchData = [],
    isLoading: isLoadingExpandedBranch,
    isError,
  } = useGetExpandedBranchQuery({
    projectName,
    parentId: itemExpanded,
  })

  if (branchData && new Set(Object.keys(branchData)).difference(new Set(Object.keys(extraData))).size > 0) {
    setExtraData({ ...extraData, ...branchData })
  }

  const {
    data: { folders = [] } = {},
    isLoading,
    isFetching,
  } = useGetFolderListQuery({ projectName: projectName || '' }, { skip: !projectName })

  let tableData: TableRow[] = useMemo(() => {
    if (!folders.length || isLoading || isFetching) return []
    let x = folders
    const ids = x.map((el) => el.id)
    for (const item of Object.values(extraData)) {
      // @ts-ignore
      if (!ids.includes(item.data.id)) {
        // @ts-ignore
        const newItem = taskToTableRow(item)
        // @ts-ignore
        x = [...x, newItem]
      }
    }

    const rows = createDataTree(x)

    return rows
  }, [folders, folderTypes, isLoading, isFetching, extraData])

  const setExpandedItem = (folderId: string) => {
    setItemExpanded(folderId)
  }

  function getFolderIcon(type: string) {
    return folderTypes[type]?.icon || 'folder'
  }

  function getTaskIcon(type: string) {
    return taskTypes[type].icon || 'folder'
  }

  function folderToTableRow(folder: FolderListItem): Omit<TableRow, 'subRows'> {
    return {
      id: folder.id,
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

  function placeholderToTableRow(
    taskName: string,
    parentFolder: FolderListItem,
  ): Omit<TableRow, 'subRows'> {
    return {
      id: '',
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

  function taskToTableRow(task: $Any): Omit<TableRow, 'subRows'> {
    return {
      id: task.data.id,
      parentId: task.data.__parentId,
      name: task.data.name,
      label: task.data.label || task.data.name,
      icon: getTaskIcon(task.data.taskType),
      img: null,
      data: {
        id: task.data.id,
        type: 'task',
        name: task.data.name,
        label: task.data.label || task.data.name,
      },
    }
  }

  function createDataTree<T extends FolderListItem>(
    items: T[],
    elementId: keyof T = 'id' as keyof T,
    parentIdKey: keyof T = 'parentId' as keyof T,
  ): TableRow[] {
    // Use Map instead of Object.create(null)
    const hashTable = new Map<string, TableRow>()
    const dataTree: TableRow[] = []
    const taskPlaceholders: TableRow[] = []

    // sort folders by name
    const sortedItems = [...items].sort((a, b) =>
      (a.label || a.name).localeCompare(b.label || b.name),
    )
    const itemsMap = sortedItems.reduce(function (map, obj) {
      // @ts-ignore
      map[obj.id] = obj
      return map
    }, {})
    const itemsMapKeys = Object.keys(itemsMap)

    // Single pass to create base rows and store in Map
    for (let i = 0; i < sortedItems.length; i++) {
      const item = sortedItems[i]
      const id = item[elementId] as string
      // @ts-ignore
      const row: TableRow = {
        // @ts-ignore
        ...(item.data ? item : folderToTableRow(item)),
        subRows: [],
      }
      hashTable.set(id, row)
      if (!item.hasTasks) {
        continue
      }

      for (const taskName of item.taskNames!) {
        // @ts-ignore
        taskPlaceholders.push(placeholderToTableRow(taskName, item))
      }
    }

    // Single pass to build relationships
    for (let i = 0; i < sortedItems.length; i++) {
      const item = sortedItems[i]
      const id = item[elementId] as string
      const parentId = item[parentIdKey] as string
      const row = hashTable.get(id)!

      if (parentId) {
        const parentRow = hashTable.get(parentId)
        if (parentRow) {
          parentRow.subRows.push(row)
        }
      } else {
        dataTree.push(row)
      }
    }

    // Iterating tasks
    for (const task of taskPlaceholders) {
      // @ts-ignore
      const parentId = task[parentIdKey]
      if (hashTable.get(parentId)?.subRows.find(e => e.name == task.name)) {
        continue
      }
      hashTable.get(parentId)?.subRows.push(task)
    }

    return dataTree
  }

  return {
    data: tableData,
    isLoading: isLoading || isFetching,
    setExpandedItem,
    expanded,
    setExpanded,
  }
}

export default useExtendedHierarchyTable
