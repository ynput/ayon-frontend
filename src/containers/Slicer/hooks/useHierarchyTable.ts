// create table data for the hierarchy
import { useGetFolderListQuery } from '@queries/getHierarchy'
import { TableRow } from '../types'
import { useCallback, useMemo } from 'react'
import { FolderListItem } from '@api/rest/folders'
import { FolderType } from '@api/rest/project'

type Props = {
  projectName: string | null
  folderTypes: FolderType[]
}

const useHierarchyTable = ({ projectName, folderTypes }: Props) => {
  const {
    data: { folders = [] } = {},
    isLoading,
    isFetching,
  } = useGetFolderListQuery({ projectName: projectName || '' }, { skip: !projectName })

  const getFolderIcon = (type: string) => {
    const folderType = folderTypes.find((folderType) => folderType.name === type)
    return folderType?.icon || 'folder'
  }

  const folderToTableRow = (folder: FolderListItem): Omit<TableRow, 'subRows'> => ({
    id: folder.id,
    parentId: folder.parentId,
    name: folder.name,
    label: folder.label || folder.name,
    icon: getFolderIcon(folder.folderType),
    img: null,
    data: {
      id: folder.id,
      name: folder.name,
      label: folder.label || folder.name,
      subType: folder.folderType,
    },
  })

  const createDataTree = <T extends FolderListItem>(
    items: T[],
    elementId: keyof T = 'id' as keyof T,
    parentId: keyof T = 'parentId' as keyof T,
  ): TableRow[] => {
    // Use Map instead of Object.create(null)
    const hashTable = new Map<string, TableRow>()
    const dataTree: TableRow[] = []

    // sort folders by name
    const sortedItems = [...items].sort((a, b) =>
      (a.label || a.name).localeCompare(b.label || b.name),
    )

    // Single pass to create base rows and store in Map
    for (let i = 0; i < sortedItems.length; i++) {
      const item = sortedItems[i]
      const id = item[elementId] as string
      const row: TableRow = {
        ...folderToTableRow(item),
        subRows: [],
      }
      hashTable.set(id, row)
    }

    // Single pass to build relationships
    for (let i = 0; i < sortedItems.length; i++) {
      const item = sortedItems[i]
      const id = item[elementId] as string
      const parentValue = item[parentId] as string
      const row = hashTable.get(id)!

      if (parentValue) {
        const parentRow = hashTable.get(parentValue)
        if (parentRow) {
          parentRow.subRows.push(row)
        }
      } else {
        dataTree.push(row)
      }
    }

    return dataTree
  }

  const tableData: TableRow[] = useMemo(() => {
    if (!folders.length || isLoading || isFetching) return []

    const rows = createDataTree(folders)

    return rows
  }, [folders, folderTypes, isLoading, isFetching])

  const getHierarchyData = useCallback(async () => {
    return tableData
  }, [tableData])

  return { data: tableData, getData: getHierarchyData, isLoading: isLoading || isFetching }
}

export default useHierarchyTable
