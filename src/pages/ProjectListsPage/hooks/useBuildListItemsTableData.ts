import {
  EntityData,
  EntityType,
  TableRow,
  useGetEntityTypeData,
  linksToTableData,
} from '@shared/containers'
import { useMemo } from 'react'
import type { EntityListItemWithLinks } from './useGetListItemsData'
import { useProjectContext } from '@shared/context'
import {
  isEntityRestricted,
  RESTRICTED_ENTITY_NAME,
  RESTRICTED_ENTITY_LABEL,
  RESTRICTED_ENTITY_ICON,
} from '@shared/containers/ProjectTreeTable/utils/restrictedEntity'

type Props = {
  listItemsData: EntityListItemWithLinks[]
}

const useBuildListItemsTableData = ({ listItemsData }: Props) => {
  const project = useProjectContext()

  const getEntityTypeData = useGetEntityTypeData({ projectInfo: project })

  const buildListItemsTableData = (listItemsData: EntityListItemWithLinks[]): TableRow[] => {
    return listItemsData.map((item) => {
      // Check if this is a restricted access entity
      const isRestricted = isEntityRestricted(item.entityType)

      const entityTypeData = getEntityTypeData(
        item.entityType,
        extractSubTypes(item, item.entityType).subType,
      )

      const primary = {
        ...buildPrimaryEntity(item, isRestricted),
        icon: isRestricted ? RESTRICTED_ENTITY_ICON : entityTypeData?.icon,
        color: isRestricted ? '' : entityTypeData?.color,
        folderId: extractFolderId(item, item.entityType),
        // @ts-expect-error - thumbnailHash does exist on products, that's it
        thumbnailHash: item.thumbnailHash,
        folder: extractFolder(item, item.entityType),
        parents: item.parents || [],
        tags: item.tags,
        status: item.status,
        hasReviewables: getHasReviewables(item) ?? false,
        subRows: [],
        links: linksToTableData(item.links, item.entityType, project.anatomy),
        subtasks: item.subtasks || [], // Add subtasks if they exist
        latestComments: item.latestComments || [],
      }
      if (primary.entityType === 'task') primary.subtasks = item.subtasks || []

      const row: TableRow = {
        id: item.id,
        primary,
        parents: buildParentEntities(item),
        subRows: [],
      }
      return row
    })
  }
  const tableData = useMemo(
    () => buildListItemsTableData(listItemsData),
    [listItemsData, getEntityTypeData],
  )
  return tableData
}

export default useBuildListItemsTableData

const buildPrimaryEntity = (item: EntityListItemWithLinks, isRestricted: boolean): EntityData => {
  const entityType = item.entityType as EntityType
  const name = isRestricted ? RESTRICTED_ENTITY_NAME : item.name
  const label = isRestricted
    ? RESTRICTED_ENTITY_LABEL
    : (entityType === 'version' ? `${item.parents?.slice(-1)[0]} - ` : '') +
      (item.label || item.name)
  const common = {
    id: item.entityId || item.id,
    name,
    label,
    status: item.status,
    tags: item.tags || [],
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : undefined,
    updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : undefined,
    path: item.parents?.join('/'),
    hasReviewables: getHasReviewables(item),
    attrib: item.attrib || {},
    ownAttrib: item.ownAttrib
      ? [...item.ownAttrib, ...item.ownItemAttrib]
      : Object.keys(item.attrib || {}),
  }

  switch (entityType) {
    case 'folder':
      return { ...common, entityType, subType: item.folderType || '' }
    case 'task':
      return {
        ...common,
        entityType,
        subType: item.taskType || '',
        assignees: item.assignees || [],
      }
    case 'product':
      return {
        ...common,
        entityType,
        subType: item.productType || '',
      }
    case 'version':
      return {
        ...common,
        entityType,
        version: Number((item as { version?: number }).version || 0),
        versionName: item.name,
        author: extractAuthor(item, entityType),
      }
  }
}

const buildParentEntities = (item: EntityListItemWithLinks) => {
  const entityType = item.entityType as EntityType
  const folderId = extractFolderId(item, entityType)
  const folderName = extractFolder(item, entityType)
  const subTypes = extractSubTypes(item, entityType)
  const parents: Partial<Record<EntityType, EntityData>> = {}

  if (folderId) {
    parents.folder = {
      id: folderId,
      entityType: 'folder',
      name: folderName,
      label: folderName,
      subType: subTypes.folderType || '',
    }
  }
  if (entityType === 'version' && hasEntityIdentity(item.product)) {
    parents.product = {
      id: item.product.id,
      entityType: 'product',
      name: item.product.name,
      label: item.product.name,
      subType: item.product.productType || '',
      productBaseType: item.product.productBaseType || '',
    }
  }
  if (entityType === 'version' && hasEntityIdentity(item.task)) {
    parents.task = {
      id: item.task.id,
      entityType: 'task',
      name: item.task.name,
      label: item.task.label || item.task.name,
      subType: item.task.taskType || '',
    }
  }

  return parents
}

// util functions
const extractSubTypes = (
  item: EntityListItemWithLinks,
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

// Parent folder name shown in the "Folder name" column. Prefer the fetched
// folder label/name (matches the Products page); fall back to the parents path
// so it still renders before graphql codegen adds the label/name fields.
const extractFolder = (item: EntityListItemWithLinks, entityType: string): string => {
  const fromParents = item.parents?.[item.parents.length - 1] || ''
  const pickName = (entity: unknown) =>
    hasEntityIdentity(entity) ? entity.label || entity.name : ''

  switch (entityType) {
    case 'task':
    case 'product':
      return pickName(item.folder) || fromParents
    case 'version':
      return pickName(item.product?.folder) || fromParents
    default:
      return fromParents
  }
}

const extractFolderId = (item: EntityListItemWithLinks, entityType: string): string => {
  switch (entityType) {
    case 'folder':
      return item.folderId || ''
    case 'task':
      return item.folderId || ''
    case 'product':
      return item.folderId || ''
    case 'version':
      return item.product?.folderId || ''
    default:
      return ''
  }
}

const extractAuthor = (item: EntityListItemWithLinks, entityType: string): string => {
  switch (entityType) {
    case 'version':
      // @ts-expect-error - author field does exist on version list items
      return item.author || undefined
    default:
      return ''
  }
}

const hasEntityIdentity = (
  entity: unknown,
): entity is { id: string; name: string; label?: string | null } =>
  !!entity &&
  typeof entity === 'object' &&
  'id' in entity &&
  typeof entity.id === 'string' &&
  'name' in entity &&
  typeof entity.name === 'string'

const getHasReviewables = (entity: unknown): boolean | undefined => {
  if (!entity || typeof entity !== 'object' || !('hasReviewables' in entity)) return undefined
  return typeof entity.hasReviewables === 'boolean' ? entity.hasReviewables : undefined
}
