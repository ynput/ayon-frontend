import type { EntityLink, LinkTypeModel } from '@shared/api'
import type { LinkEntity } from '@shared/components/LinksManager/LinksManager'
import { getEntityColor, getEntityIcon, IconAnatomy } from '@shared/util/iconUtils'

export type LinkDirection = 'in' | 'out'

export type EntityLinkGroup = {
  key: string
  direction: LinkDirection
  /** full link type name, e.g. "breakdown|folder|folder" */
  linkTypeName: string
  /** link type only, e.g. "breakdown" */
  linkType: string
  /** type of the entities on the other end of the links */
  otherEntityType: string
  color?: string
  /** false when the link type is no longer in the project anatomy */
  inAnatomy: boolean
  links: LinkEntity[]
}

const toLinkEntity = (link: EntityLink, anatomy: IconAnatomy): LinkEntity => {
  const { id, entityType, node, isRestricted } = link
  if (isRestricted || !node) {
    return {
      label: '',
      parents: [],
      linkId: id,
      entityId: '',
      entityType,
      icon: getEntityIcon(entityType, undefined, anatomy),
      isRestricted: true,
    }
  }
  return {
    label: (node.label || node.name) as string,
    parents: node.parents || [],
    linkId: id,
    entityId: node.id,
    entityType,
    icon: getEntityIcon(entityType, node.subType, anatomy),
    color: getEntityColor(entityType, node.subType, anatomy),
  }
}

/**
 * Group the links of one entity by direction and link type. Link types from
 * the anatomy that could apply to the entity are included even when empty, so
 * they can be offered for adding new links.
 */
export const groupEntityLinks = (
  links: EntityLink[],
  entityType: string,
  linkTypes: LinkTypeModel[],
  anatomy: IconAnatomy,
): EntityLinkGroup[] => {
  const groups = new Map<string, EntityLinkGroup>()

  const ensure = (direction: LinkDirection, linkType: string, otherEntityType: string) => {
    const linkTypeName =
      direction === 'in'
        ? `${linkType}|${otherEntityType}|${entityType}`
        : `${linkType}|${entityType}|${otherEntityType}`
    const key = `${direction}:${linkTypeName}`
    let group = groups.get(key)
    if (!group) {
      const def = linkTypes.find((lt) => lt.name === linkTypeName)
      group = {
        key,
        direction,
        linkTypeName,
        linkType,
        otherEntityType,
        color: def?.data?.color,
        inAnatomy: !!def,
        links: [],
      }
      groups.set(key, group)
    }
    return group
  }

  for (const lt of linkTypes) {
    if (lt.outputType === entityType) ensure('in', lt.linkType, lt.inputType)
    if (lt.inputType === entityType) ensure('out', lt.linkType, lt.outputType)
  }

  for (const link of links) {
    const direction = link.direction as LinkDirection
    ensure(direction, link.linkType, link.entityType).links.push(toLinkEntity(link, anatomy))
  }

  return [...groups.values()].sort(
    (a, b) =>
      a.direction.localeCompare(b.direction) ||
      Number(!a.links.length) - Number(!b.links.length) ||
      a.linkType.localeCompare(b.linkType) ||
      a.otherEntityType.localeCompare(b.otherEntityType),
  )
}
