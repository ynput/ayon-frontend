import { ColumnSortEvent } from 'primereact/column'
import { FolderRow } from './formatTaskProgressForTable'

interface CustomColumnSortEvent extends ColumnSortEvent {
  data: FolderRow[]
  order: 1 | -1
}

type Props = {
  parents: FolderRow[]
  children: FolderRow[]
}

export const useFolderSort = ({ parents, children }: Props) => {
  const sortFolderRows = (event: CustomColumnSortEvent): FolderRow[] => {
    const sortField = event.field
    const order = event.order

    const sortByField = (a: FolderRow, b: FolderRow) => {
      const fieldA = a[sortField]
      const fieldB = b[sortField]
      if (fieldA < fieldB) return order === 1 ? -1 : 1
      if (fieldA > fieldB) return order === 1 ? 1 : -1
      return 0
    }

    // Sort parent rows
    parents.sort(sortByField)
    // Sort child rows
    children.sort(sortByField)

    // Insert child rows after their parent
    const sortedData = parents.reduce((acc, parent) => {
      acc.push(parent)
      acc.push(...children.filter((child) => child.__parentId === parent.__folderId))
      return acc
    }, [] as FolderRow[])

    return sortedData
  }

  return (e: CustomColumnSortEvent) => sortFolderRows(e)
}
