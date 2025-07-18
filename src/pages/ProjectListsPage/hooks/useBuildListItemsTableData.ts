import { EntityListItem } from '@shared/api'
import { TableRow, useGetEntityTypeData, useProjectDataContext } from '@shared/containers'
import { useMemo } from 'react'

type Props = {
  listItemsData: EntityListItem[]
}

const useBuildListItemsTableData = ({ listItemsData }: Props) => {
  const { projectInfo } = useProjectDataContext()

  const getEntityTypeData = useGetEntityTypeData({ projectInfo })

  const buildListItemsTableData = (listItemsData: EntityListItem[]): TableRow[] => {
    return listItemsData.map((item) => ({
      id: item.id,
      name: item.name,
      label:
        (item.entityType === 'version' ? `${item.product?.name} - ` : '') +
        (item.label || item.name),
      entityId: item.entityId,
      entityType: item.entityType,
      assignees: item.assignees || [],
      ...extractSubTypes(item, item.entityType), // subType, folderType, taskType, productType
      updatedAt: item.updatedAt,
      attrib: item.attrib,
      ownAttrib: item.ownAttrib
        ? [...item.ownAttrib, ...item.ownItemAttrib]
        : Object.keys(item.attrib), // not all types use ownAttrib so fallback to attrib keys
      icon: getEntityTypeData(item.entityType, extractSubTypes(item, item.entityType).subType)
        ?.icon,
      path: extractPath(item, item.entityType),
      tags: item.tags,
      status: item.status,
      hasReviewables: 'hasReviewables' in item ? item.hasReviewables : false, // products don't have this field
      subRows: [],
      links: {}, // Add empty links object
    }))
  }
  const tableData = useMemo(
    () => buildListItemsTableData(listItemsData),
    [listItemsData, getEntityTypeData],
  )
  return tableData
}

export default useBuildListItemsTableData

// util functions
const extractSubTypes = (
  item: EntityListItem,
  entityType?: string,
): {
  subType?: string
  folderType?: string
  taskType?: string
  productType?: string
} => {
  switch (entityType) {
    case 'folder':
      return { subType: item.folderType, folderType: item.folderType }
    case 'task':
      return {
        subType: item.taskType,
        taskType: item.taskType,
        folderType: item.folder?.folderType,
      }
    case 'product':
      return { subType: item.productType || '', folderType: item.folder?.folderType }
    case 'version':
      return {
        subType: undefined,
        productType: item.product?.productType,
        folderType: item.product?.folder?.folderType,
        taskType: item.task?.taskType,
      }
    default:
      return {}
  }
}

const extractPath = (item: EntityListItem, entityType: string): string => {
  switch (entityType) {
    case 'folder':
      return item.path || ''
    case 'task':
      return item.folder?.path || ''
    case 'product':
      return item.folder?.path || ''
    case 'version':
      return (item.product?.folder?.path || '') + (item.task?.name || '')
    default:
      return ''
  }
}
