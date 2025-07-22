// converts the links array to the data shown in the table (object of link keys with list of link entity names)
// we split the links by direction (in/out) and store them in an object

import { LinkEntity } from '@shared/components'
import { getLinkKey } from '../buildTreeTableColumns'
import { EntityLink } from '@shared/api'

export type LinkId = string
export type LinkValue = LinkEntity[]
export type LinksTableData = Record<LinkId, LinkValue>

export const linksToTableData = (
  links: EntityLink[] | undefined,
  entityType: string,
): LinksTableData =>
  links?.reduce((acc, edge) => {
    const { linkType, direction, entityType: linkEntityType, id, node } = edge
    const entityData: LinkEntity = {
      label: node.label || node.name,
      path: node.path,
      linkId: id,
      entityId: node.id,
      entityType: linkEntityType,
    }

    // we must build the entity link type name based on the direction and entity types
    // e.g. "linkType|inEntityType|outEntityType"
    const linkTypeName = linkTypeToLinkName(linkType, entityType, linkEntityType, direction)

    const tableId = getLinkKey({ name: linkTypeName }, direction)

    if (!acc[tableId]) {
      acc[tableId] = []
    }

    // add the entity name to the link type
    if (!acc[tableId].includes(entityData)) {
      acc[tableId].push(entityData)
    }

    return acc
  }, {} as LinksTableData) || {}

// converts the link type + in/out entity types to a link name format {linkType}|in|out
const linkTypeToLinkName = (
  linkType: string,
  baseEntityType: string,
  linkEntityType: string,
  direction: 'in' | 'out' | string,
): string => {
  const firstType = direction === 'in' ? linkEntityType : baseEntityType
  const secondType = direction === 'in' ? baseEntityType : linkEntityType
  return `${linkType}|${firstType}|${secondType}`
}
