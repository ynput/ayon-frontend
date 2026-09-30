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

/** An entity whose links are collected, the dialog's entity or one of its children. */
export type LinkMember = {
  id: string
  entityType: string
  name: string
  subType?: string
}

export type AggregatedLink = {
  key: string
  /** the entity on the other end */
  link: LinkEntity
  /** members that have a link to it */
  via: LinkMember[]
}

export type AggregatedLinkGroup = {
  key: string
  direction: LinkDirection
  linkTypeName: string
  linkType: string
  otherEntityType: string
  /** type of the members holding the links */
  memberEntityType: string
  color?: string
  items: AggregatedLink[]
}

const linkPath = (link: LinkEntity) => [...link.parents, link.label].join('/')

const byName = (a: LinkMember, b: LinkMember) =>
  a.name.localeCompare(b.name, undefined, { numeric: true })

/**
 * Collect the links of an entity and its children with one row per linked
 * entity, listing the members that link to it. Links between two members
 * are a dependency inside the subtree rather than of it, so they are left
 * out and only counted.
 */
export const aggregateLinks = (
  members: { member: LinkMember; links: EntityLink[] }[],
  direction: LinkDirection,
  linkTypes: LinkTypeModel[],
  anatomy: IconAnatomy,
): { groups: AggregatedLinkGroup[]; internal: number } => {
  const memberIds = new Set(members.map(({ member }) => member.id))
  const groups = new Map<string, AggregatedLinkGroup & { byEntity: Map<string, AggregatedLink> }>()
  let internal = 0

  for (const { member, links } of members) {
    for (const link of links) {
      if (link.direction !== direction) continue
      if (link.node && memberIds.has(link.node.id)) {
        internal++
        continue
      }
      const linkTypeName =
        direction === 'in'
          ? `${link.linkType}|${link.entityType}|${member.entityType}`
          : `${link.linkType}|${member.entityType}|${link.entityType}`
      let group = groups.get(linkTypeName)
      if (!group) {
        group = {
          key: `${direction}:${linkTypeName}`,
          direction,
          linkTypeName,
          linkType: link.linkType,
          otherEntityType: link.entityType,
          memberEntityType: member.entityType,
          color: linkTypes.find((lt) => lt.name === linkTypeName)?.data?.color,
          items: [],
          byEntity: new Map(),
        }
        groups.set(linkTypeName, group)
      }
      const linked = toLinkEntity(link, anatomy)
      // restricted links can't be told apart, each gets its own row
      const key = linked.isRestricted ? `restricted_${link.id}` : linked.entityId
      let item = group.byEntity.get(key)
      if (!item) {
        item = { key, link: linked, via: [] }
        group.byEntity.set(key, item)
        group.items.push(item)
      }
      if (!item.via.includes(member)) item.via.push(member)
    }
  }

  return {
    groups: [...groups.values()]
      .map(({ byEntity, ...group }) => ({
        ...group,
        items: group.items
          .map((item) => ({ ...item, via: [...item.via].sort(byName) }))
          .sort(
            (a, b) =>
              Number(!!a.link.isRestricted) - Number(!!b.link.isRestricted) ||
              linkPath(a.link).localeCompare(linkPath(b.link)),
          ),
      }))
      .sort(
        (a, b) =>
          a.linkType.localeCompare(b.linkType) ||
          a.otherEntityType.localeCompare(b.otherEntityType),
      ),
    internal,
  }
}
