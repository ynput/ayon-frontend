// converts the links array to the data shown in the table (object of link keys with list of link entity names)
// we split the links by direction (in/out) and store them in an object

import { EditorTaskNode } from '.'
import { getLinkKey } from '../buildTreeTableColumns'

export type LinkId = string
export type LinkValue = string[]
export type LinksTableData = Record<LinkId, LinkValue>

export const linksToTableData = (
  links: EditorTaskNode['links'],
  entityType: string,
): LinksTableData =>
  links.edges.reduce((acc, edge) => {
    const { linkType, direction, entityType: linkEntityType, node } = edge
    const entityLabel = 'label' in node ? node.label || node.name : node.name

    // we must build the entity link type name based on the direction and entity types
    // e.g. "linkType|inEntityType|outEntityType"
    const linkTypeName = linkTypeToLinkName(linkType, entityType, linkEntityType, direction)

    const id = getLinkKey({ name: linkTypeName }, direction)

    if (!acc[id]) {
      acc[id] = []
    }

    // add the entity name to the link type
    if (!acc[id].includes(entityLabel)) {
      acc[id].push(entityLabel)
    }

    return acc
  }, {} as LinksTableData)

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
