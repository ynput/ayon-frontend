// The Incoming or Outgoing column with "Include children" on: the links of
// the entity and everything below it, one row per entity on the other end.
// Read-only.

import { FC, Fragment, ReactNode, useMemo, useState } from 'react'
import { Button, Icon, InputSwitch, InputText } from '@ynput/ayon-react-components'
import { detailsPanelEntityTypes, useGetLinksOfEntitiesQuery } from '@shared/api'
import type { DetailsPanelEntityType, LinkTypeModel } from '@shared/api'
import { LinkItem } from '@shared/components/LinksManager/LinksManager.styled'
import { EntityIcon } from '@shared/components/EntityIcon/EntityIcon'
import { getRequestErrorString } from '@shared/util'
import type { IconAnatomy } from '@shared/util/iconUtils'
import {
  aggregateLinks,
  AggregatedLink,
  AggregatedLinkGroup,
  LinkDirection,
  LinkMember,
} from './groupEntityLinks'
import type { LinkedEntityRef } from './EntityLinksPanel'
import { MAX_CHILDREN } from './useEntityChildren'
import * as Styled from './EntityLinksDialog.styled'

// rows rendered per link type before "Show all"
const GROUP_ROWS = 100
// the filter shows up for lists longer than this
const FILTER_MIN_ROWS = 20
const MAX_TOOLTIP_NAMES = 20

export const plural = (word: string, n: number) =>
  n === 1
    ? word
    : /[^aeiou]y$/.test(word)
    ? `${word.slice(0, -1)}ies`
    : /(s|x|z|ch|sh)$/.test(word)
    ? `${word}es`
    : `${word}s`

/** "shots" when all members share a type, the entity type otherwise */
export const membersNoun = (members: LinkMember[], n: number) => {
  const subTypes = new Set(members.map((m) => m.subType))
  const [subType] = subTypes
  const word = subTypes.size === 1 && subType ? subType.toLowerCase() : members[0]?.entityType
  return plural(word || 'child', n)
}

// "this", "010_0020", "010_0020, 010_0030" or "this + 12 shots"
const viaLabel = (via: LinkMember[], selfId: string) => {
  const self = via.some((m) => m.id === selfId)
  const children = via.filter((m) => m.id !== selfId)
  const parts = self ? ['this'] : []
  if (children.length && children.length <= 2 && !self)
    parts.push(children.map((m) => m.name).join(', '))
  else if (children.length)
    parts.push(`${children.length} ${membersNoun(children, children.length)}`)
  return parts.join(' + ')
}

const listNames = (names: string[]) => {
  const shown = names.slice(0, MAX_TOOLTIP_NAMES).join(', ')
  const more = names.length - MAX_TOOLTIP_NAMES
  return more > 0 ? `${shown} and ${more} more` : shown
}

const linkPath = (item: AggregatedLink) =>
  item.link.isRestricted ? '' : [...item.link.parents, item.link.label].join('/')

const viaTooltip = (item: AggregatedLink, selfId: string) => {
  const names = item.via.map((m) => (m.id === selfId ? `${m.name} (this)` : m.name))
  const path = linkPath(item)
  return `${path ? `${path}: ` : ''}linked to ${listNames(names)}`
}

interface ChildrenSwitchProps {
  direction: LinkDirection
  entityType: string
  childEntities: LinkMember[]
  truncated: boolean
  checked: boolean
  onChange: (checked: boolean) => void
}

export const ChildrenSwitch: FC<ChildrenSwitchProps> = ({
  direction,
  entityType,
  childEntities,
  truncated,
  checked,
  onChange,
}) => (
  <Styled.ChildrenSwitch
    data-tooltip={`Also list the ${direction === 'in' ? 'incoming' : 'outgoing'} links of all ${
      childEntities.length
    }${truncated ? '+' : ''} ${membersNoun(
      childEntities,
      childEntities.length,
    )} below this ${entityType}`}
  >
    Include children
    <InputSwitch checked={checked} compact onChange={() => onChange(!checked)} />
  </Styled.ChildrenSwitch>
)

interface AggregatedGroupSectionProps {
  group: AggregatedLinkGroup
  items: AggregatedLink[]
  selfId: string
  isManager: boolean
  onOpenEntity: (entity: LinkedEntityRef) => void
}

const AggregatedGroupSection: FC<AggregatedGroupSectionProps> = ({
  group,
  items,
  selfId,
  isManager,
  onOpenEntity,
}) => {
  const [showAll, setShowAll] = useState(false)
  const shown = showAll ? items : items.slice(0, GROUP_ROWS)
  const pair =
    group.direction === 'in'
      ? `${group.otherEntityType} → ${group.memberEntityType}`
      : `${group.memberEntityType} → ${group.otherEntityType}`
  return (
    <Styled.Group>
      <Styled.GroupHeader>
        <span
          className="dot"
          style={{ backgroundColor: group.color || 'var(--md-sys-color-outline)' }}
        />
        <span>{group.linkType}</span>
        <span className="pair">{pair}</span>
        <span className="grow" />
        <span className="pair">
          {items.length === group.items.length
            ? items.length
            : `${items.length} of ${group.items.length}`}
        </span>
      </Styled.GroupHeader>
      {shown.map((item) => {
        const { link } = item
        const clickable =
          !link.isRestricted &&
          detailsPanelEntityTypes.includes(link.entityType as DetailsPanelEntityType)
        return (
          <LinkItem
            key={item.key}
            className={
              link.isRestricted
                ? isManager
                  ? 'unknown'
                  : 'restricted'
                : clickable
                ? 'clickable'
                : undefined
            }
            onClick={() =>
              clickable && onOpenEntity({ id: link.entityId, entityType: link.entityType })
            }
            data-tooltip={viaTooltip(item, selfId)}
          >
            <EntityIcon
              entity={{ entityType: link.entityType }}
              icon={link.icon}
              color={link.color}
            />
            <span className="title">
              {link.isRestricted ? (
                <span className="label">{isManager ? 'Unknown' : 'Access Restricted'}</span>
              ) : (
                <>
                  {link.parents.map((part, index) => (
                    <Fragment key={index}>
                      <span>{part}</span>
                      <span>/</span>
                    </Fragment>
                  ))}
                  <span className="label">{link.label}</span>
                </>
              )}
            </span>
            <Styled.Via>{viaLabel(item.via, selfId)}</Styled.Via>
          </LinkItem>
        )
      })}
      {shown.length < items.length && (
        <Button
          variant="text"
          label={`Show all ${items.length}`}
          onClick={() => setShowAll(true)}
        />
      )}
    </Styled.Group>
  )
}

interface ChildrenLinksColumnProps {
  direction: LinkDirection
  projectName: string
  self: LinkMember
  childEntities: LinkMember[]
  /** the entity has more children than were included */
  childrenTruncated: boolean
  isLoadingChildren: boolean
  linkTypes: LinkTypeModel[]
  anatomy: IconAnatomy
  isManager: boolean
  /** the "Include children" switch */
  switchControl: ReactNode
  onOpenEntity: (entity: LinkedEntityRef) => void
}

export const ChildrenLinksColumn: FC<ChildrenLinksColumnProps> = ({
  direction,
  projectName,
  self,
  childEntities,
  childrenTruncated,
  isLoadingChildren,
  linkTypes,
  anatomy,
  isManager,
  switchControl,
  onOpenEntity,
}) => {
  const [filter, setFilter] = useState('')
  const members = useMemo(() => [self, ...childEntities], [self, childEntities])
  const memberIds = useMemo(() => members.map((m) => m.id), [members])
  const { data, isFetching, error } = useGetLinksOfEntitiesQuery(
    { projectName, entityIds: memberIds, direction },
    { skip: isLoadingChildren, refetchOnMountOrArgChange: true },
  )

  const aggregated = useMemo(() => {
    if (!data) return undefined
    const linksById = new Map(data.entities.map((e) => [e.id, e.links]))
    return aggregateLinks(
      members.map((member) => ({ member, links: linksById.get(member.id) || [] })),
      direction,
      linkTypes,
      anatomy,
    )
  }, [data, members, direction, linkTypes, anatomy])

  const groups = aggregated?.groups || []
  const total = groups.reduce((n, g) => n + g.items.length, 0)

  // match the linked entity's path or the name of a child using it
  const query = filter.trim().toLowerCase()
  const filtered = useMemo(
    () =>
      groups
        .map((group) => ({
          group,
          items: query
            ? group.items.filter(
                (item) =>
                  linkPath(item).toLowerCase().includes(query) ||
                  item.via.some((m) => m.name.toLowerCase().includes(query)),
              )
            : group.items,
        }))
        .filter(({ items }) => items.length),
    [groups, query],
  )

  // shots or assets, not the sequences and categories holding them
  const leaves = childEntities.filter((m) => m.isLeaf !== false)
  const unlinked = (aggregated?.unlinked || []).filter(
    (m) => m.isLeaf !== false && m.id !== self.id,
  )
  const noun = membersNoun(childEntities, childEntities.length)
  const isIn = direction === 'in'

  return (
    <Styled.Column>
      <Styled.ColumnHeader>
        <Icon icon={isIn ? 'login' : 'logout'} />
        {isIn ? 'Incoming' : 'Outgoing'}
        <span className="count">{total}</span>
        <span className="hint">
          {isIn ? 'inputs of this and its' : 'uses this or its'} {childEntities.length}
          {childrenTruncated ? '+' : ''} {noun}
        </span>
        {switchControl}
      </Styled.ColumnHeader>
      {total > FILTER_MIN_ROWS && (
        <InputText
          value={filter}
          placeholder={`Filter by path or ${membersNoun(childEntities, 1)} name…`}
          onChange={(e) => setFilter(e.target.value)}
        />
      )}
      {error ? (
        <Styled.Empty>Could not load links: {getRequestErrorString(error)}</Styled.Empty>
      ) : !aggregated ? (
        <Styled.Empty>Loading links…</Styled.Empty>
      ) : !total ? (
        <Styled.Empty>No {isIn ? 'incoming' : 'outgoing'} links</Styled.Empty>
      ) : !filtered.length ? (
        <Styled.Empty>Nothing matches "{filter}"</Styled.Empty>
      ) : (
        filtered.map(({ group, items }) => (
          <AggregatedGroupSection
            key={group.key}
            group={group}
            items={items}
            selfId={self.id}
            isManager={isManager}
            onOpenEntity={onOpenEntity}
          />
        ))
      )}
      {aggregated && (
        <Styled.Notes>
          {/* only useful when some children do have links */}
          {!!unlinked.length && unlinked.length < leaves.length && (
            <span data-tooltip={listNames(unlinked.map((m) => m.name))}>
              {unlinked.length} of {leaves.length} {membersNoun(leaves, leaves.length)}{' '}
              {unlinked.length === 1 ? 'has' : 'have'} no {isIn ? 'incoming' : 'outgoing'} links.
            </span>
          )}
          {!!aggregated.internal && (
            <span>
              {aggregated.internal} {plural('link', aggregated.internal)} between children not
              shown.
            </span>
          )}
          {childrenTruncated && <span>Only the first {MAX_CHILDREN} children are included.</span>}
          {data?.truncated && <span>Too many links, the list is incomplete.</span>}
          {isFetching && <span>Updating…</span>}
        </Styled.Notes>
      )}
    </Styled.Column>
  )
}
