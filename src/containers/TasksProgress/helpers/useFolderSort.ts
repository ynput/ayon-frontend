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
    const { field: sortField, order } = event

    // Comparator function to handle sorting
    const compareFields = (a: FolderRow, b: FolderRow) => {
      const fieldA = a[sortField]
      const fieldB = b[sortField]

      if (typeof fieldA === 'string' && typeof fieldB === 'string') {
        return order * fieldA.localeCompare(fieldB)
      }
      return order * (fieldA < fieldB ? -1 : fieldA > fieldB ? 1 : 0)
    }

    // Sort parents and children independently
    parents.sort(compareFields)
    children.sort(compareFields)

    // Create a map to group children by their parent ID for quick access
    const childrenByParentId = new Map<string, FolderRow[]>()
    children.forEach((child) => {
      if (!child.__parentId) return
      const parentId = child.__parentId
      if (!childrenByParentId.has(parentId)) {
        childrenByParentId.set(parentId, [])
      }
      childrenByParentId.get(parentId)!.push(child)
    })

    // Combine parents and their corresponding children while maintaining hierarchy
    const sortedData = parents.reduce((acc, parent) => {
      acc.push(parent)
      const associatedChildren = childrenByParentId.get(parent.__folderId)
      if (associatedChildren) {
        acc.push(...associatedChildren)
      }
      return acc
    }, [] as FolderRow[])

    return sortedData
  }

  return (e: CustomColumnSortEvent) => sortFolderRows(e)
}
