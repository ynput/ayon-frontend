import { FC, Fragment, lazy, Suspense, useMemo, useState } from 'react'
import { Button, Icon, InputSwitch } from '@ynput/ayon-react-components'
import {
  detailsPanelEntityTypes,
  useGetEntitiesDetailsPanelQuery,
  useGetEntityLinksQuery,
  useGetEntityQuery,
  useGetLinksOfEntitiesQuery,
} from '@shared/api'
import type { DetailsPanelEntityType } from '@shared/api'
import { useProjectContext } from '@shared/context'
import { useGlobalContext } from '@shared/context/GlobalContext'
import { Thumbnail } from '@shared/components/Thumbnail'
import { LinkManagerItem } from '@shared/components/LinksManager/LinkManagerItem'
import { LinkItem } from '@shared/components/LinksManager/LinksManager.styled'
import { EntityIcon } from '@shared/components/EntityIcon/EntityIcon'
import AddNewLinks, { LinkSearchType } from '@shared/components/LinksManager/AddNewLinks'
import useUpdateLinks from '@shared/components/LinksManager/hooks/useUpdateLinks'
import { groupLinksByEntity } from '@shared/components/LinksManager/utils/groupLinks'
import { EntityPickerDialog } from '@shared/containers/EntityPickerDialog/EntityPickerDialog'
import type { PickerEntityType } from '@shared/containers/EntityPickerDialog/EntityPickerDialog'
import { getEntityColor, getEntityIcon } from '@shared/util/iconUtils'
import { getEntityId, getRequestErrorString } from '@shared/util'
import {
  aggregateLinks,
  AggregatedLink,
  AggregatedLinkGroup,
  EntityLinkGroup,
  groupEntityLinks,
  LinkMember,
} from './groupEntityLinks'
import { MAX_CHILDREN, useEntityChildren } from './useEntityChildren'
import * as Styled from './EntityLinksDialog.styled'

// React Flow is only loaded when someone switches to the graph view
const EntityLinksGraph = lazy(() => import('./EntityLinksGraph'))

export type LinkedEntityRef = { id: string; entityType: string }

type EntityHeaderInfo = {
  name: string
  subType?: string
  status?: string
  path?: string
  thumbnailHash?: string
}

const useEntityHeader = (
  projectName: string,
  entityType: string,
  entityId: string,
): EntityHeaderInfo | undefined => {
  const isPanelType = detailsPanelEntityTypes.includes(entityType as DetailsPanelEntityType)
  const { data: panelData } = useGetEntitiesDetailsPanelQuery(
    { entityType: entityType as DetailsPanelEntityType, entities: [{ id: entityId, projectName }] },
    { skip: !isPanelType },
  )
  const { data: restData } = useGetEntityQuery(
    { projectName, entityType, entityId },
    { skip: isPanelType },
  )

  if (isPanelType) {
    const e = panelData?.[0]
    if (!e) return undefined
    const name =
      entityType === 'version' && e.product
        ? `${e.product.name} ${e.name}`
        : entityType === 'representation' && e.product && e.version
        ? `${e.product.name} ${e.version.name} ${e.name}`
        : e.label || e.name
    return {
      name,
      subType: e.entitySubType,
      status: e.status,
      path: e.parents?.join(' / '),
      thumbnailHash: e.thumbnailHash,
    }
  }
  if (!restData) return undefined
  // workfiles have no name, only a path
  const fileName = restData.path?.split('/').pop()
  return {
    name: restData.label || restData.name || fileName,
    subType: restData.productType || restData.folderType || restData.taskType,
    status: restData.status,
    path: restData.path,
  }
}

interface LinkGroupSectionProps {
  group: EntityLinkGroup
  projectName: string
  entityId: string
  entityType: string
  canEdit: boolean
  onOpenEntity: (entity: LinkedEntityRef) => void
}

const LinkGroupSection: FC<LinkGroupSectionProps> = ({
  group,
  projectName,
  entityId,
  entityType,
  canEdit,
  onOpenEntity,
}) => {
  const [searchType, setSearchType] = useState<LinkSearchType>(null)
  const [isAddingPicked, setIsAddingPicked] = useState(false)
  const { user } = useGlobalContext()
  const isManager = !!(user?.data?.isAdmin || user?.data?.isManager)
  const updater = useUpdateLinks({
    projectName,
    direction: group.direction,
    entityId,
    entityType,
    targetEntityType: group.otherEntityType,
    linkType: group.linkTypeName,
  })

  const grouped = groupLinksByEntity(group.links)
  const pair =
    group.direction === 'in'
      ? `${group.otherEntityType} → ${entityType}`
      : `${entityType} → ${group.otherEntityType}`

  const handlePickerSubmit = async (ids: string[]) => {
    if (isAddingPicked) return
    setIsAddingPicked(true)
    const ok = await updater.add(ids.map((id) => ({ targetEntityId: id, linkId: getEntityId() })))
    setIsAddingPicked(false)
    if (ok) setSearchType(null)
  }

  return (
    <Styled.Group className={grouped.length ? undefined : 'empty'}>
      <Styled.GroupHeader>
        <span
          className="dot"
          style={{ backgroundColor: group.color || 'var(--md-sys-color-outline)' }}
        />
        <span>{group.linkType}</span>
        <span className="pair">{pair}</span>
        <span className="grow" />
        {!!grouped.length && <span className="pair">{group.links.length}</span>}
        {canEdit && group.inAnatomy && (
          <Button
            icon="add_link"
            variant="text"
            data-tooltip={`Add ${group.linkType} link`}
            onClick={() => setSearchType(searchType ? null : 'search')}
          />
        )}
      </Styled.GroupHeader>
      {grouped.map((g) => (
        <LinkManagerItem
          key={g.groupKey}
          link={g.representative}
          count={g.count}
          readOnly={!canEdit}
          isManager={isManager}
          onEntityClick={(id, type) => onOpenEntity({ id, entityType: type })}
          onRemove={(e) => {
            e.stopPropagation()
            updater.remove(
              g.linkIds.map((id) => ({
                id,
                target: { entityId: g.entityId, entityType: g.representative.entityType },
              })),
            )
          }}
          onCountChange={(count) => {
            const diff = count - g.count
            if (diff > 0) {
              updater.add(
                Array.from({ length: diff }, () => ({
                  targetEntityId: g.entityId,
                  linkId: getEntityId(),
                })),
              )
            } else if (diff < 0) {
              updater.remove(
                g.linkIds.slice(diff).map((id) => ({
                  id,
                  target: { entityId: g.entityId, entityType: g.representative.entityType },
                })),
              )
            }
          }}
        />
      ))}
      {searchType === 'search' && (
        <AddNewLinks
          targetEntityType={group.otherEntityType}
          projectName={projectName}
          onClose={() => setSearchType(null)}
          onAdd={(id) => updater.add([{ targetEntityId: id, linkId: getEntityId() }])}
          onSearchTypeChange={setSearchType}
        />
      )}
      {searchType === 'picker' && (
        <EntityPickerDialog
          onClose={() => setSearchType(null)}
          projectName={projectName}
          entityType={group.otherEntityType as PickerEntityType}
          onSubmit={handlePickerSubmit}
          isLoading={isAddingPicked}
          isMultiSelect
        />
      )}
    </Styled.Group>
  )
}

const plural = (word: string, n: number) =>
  n === 1
    ? word
    : /[^aeiou]y$/.test(word)
    ? `${word.slice(0, -1)}ies`
    : /(s|x|z|ch|sh)$/.test(word)
    ? `${word}es`
    : `${word}s`

/** "shots" when all members share a type, the entity type otherwise */
const membersNoun = (members: LinkMember[], n: number) => {
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

const MAX_TOOLTIP_NAMES = 20

const viaTooltip = (item: AggregatedLink, selfId: string) => {
  const names = item.via.map((m) => (m.id === selfId ? `${m.name} (this)` : m.name))
  const shown = names.slice(0, MAX_TOOLTIP_NAMES).join(', ')
  const more =
    names.length > MAX_TOOLTIP_NAMES ? ` and ${names.length - MAX_TOOLTIP_NAMES} more` : ''
  const path = item.link.isRestricted
    ? ''
    : `${[...item.link.parents, item.link.label].join('/')}: `
  return `${path}linked to ${shown}${more}`
}

interface AggregatedGroupSectionProps {
  group: AggregatedLinkGroup
  selfId: string
  isManager: boolean
  onOpenEntity: (entity: LinkedEntityRef) => void
}

const AggregatedGroupSection: FC<AggregatedGroupSectionProps> = ({
  group,
  selfId,
  isManager,
  onOpenEntity,
}) => {
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
        <span className="pair">{group.items.length}</span>
      </Styled.GroupHeader>
      {group.items.map((item) => {
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
    </Styled.Group>
  )
}

export type EntityLinksView = 'columns' | 'graph'

export interface EntityLinksPanelProps {
  projectName: string
  entityType: string
  entityId: string
  canEdit: boolean
  /** the graph view is read-only */
  view?: EntityLinksView
  /** columns view: incoming links of the entity and everything below it, read-only */
  includeChildren?: boolean
  onIncludeChildrenChange?: (includeChildren: boolean) => void
  onOpenEntity: (entity: LinkedEntityRef) => void
  onOpenDetails?: () => void
}

export const EntityLinksPanel: FC<EntityLinksPanelProps> = ({
  projectName,
  entityType,
  entityId,
  canEdit,
  view = 'columns',
  includeChildren = false,
  onIncludeChildrenChange,
  onOpenEntity,
  onOpenDetails,
}) => {
  const { linkTypes = [], anatomy } = useProjectContext()
  const { user } = useGlobalContext()
  const isManager = !!(user?.data?.isAdmin || user?.data?.isManager)
  const header = useEntityHeader(projectName, entityType, entityId)
  const {
    data: linksData = [],
    isLoading,
    error,
  } = useGetEntityLinksQuery({
    projectName,
    entityIds: [entityId],
    entityType: entityType as any,
  })

  const links = useMemo(
    () => linksData.find((e) => e.id === entityId)?.links || [],
    [linksData, entityId],
  )
  const groups = useMemo(
    () => groupEntityLinks(links, entityType, linkTypes, anatomy),
    [links, entityType, linkTypes, anatomy],
  )

  const children = useEntityChildren(projectName, entityType, entityId)
  const hasChildren = children.children.length > 0
  const showChildren = includeChildren && hasChildren && view === 'columns'
  const childIds = useMemo(() => children.children.map((c) => c.id), [children.children])
  const {
    data: childLinksData = [],
    isFetching: isFetchingChildLinks,
    error: childLinksError,
  } = useGetLinksOfEntitiesQuery(
    { projectName, entityIds: childIds, entityType: children.childType || 'folder' },
    { skip: !showChildren, refetchOnMountOrArgChange: true },
  )

  const aggregated = useMemo(() => {
    if (!showChildren) return undefined
    const linksById = new Map<string, typeof links>()
    for (const e of [...linksData, ...childLinksData]) linksById.set(e.id, e.links)
    const self: LinkMember = {
      id: entityId,
      entityType,
      name: header?.name || entityType,
      subType: header?.subType,
    }
    return aggregateLinks(
      [self, ...children.children].map((member) => ({
        member,
        links: linksById.get(member.id) || [],
      })),
      'in',
      linkTypes,
      anatomy,
    )
  }, [
    showChildren,
    linksData,
    childLinksData,
    entityId,
    entityType,
    header,
    children,
    linkTypes,
    anatomy,
  ])

  const icon = getEntityIcon(entityType, header?.subType, anatomy)
  const color = getEntityColor(entityType, header?.subType, anatomy)

  const childrenSwitch = hasChildren && onIncludeChildrenChange && (
    <Styled.ChildrenSwitch
      data-tooltip={`Also list the incoming links of all ${children.children.length}${
        children.truncated ? '+' : ''
      } ${membersNoun(children.children, children.children.length)} below this ${entityType}`}
    >
      Include children
      <InputSwitch
        checked={includeChildren}
        compact
        onChange={() => onIncludeChildrenChange(!includeChildren)}
      />
    </Styled.ChildrenSwitch>
  )

  const renderChildrenColumn = (agg: NonNullable<typeof aggregated>) => {
    const total = agg.groups.reduce((n, g) => n + g.items.length, 0)
    const loading = isLoading || isFetchingChildLinks || children.isLoading
    const count = children.children.length
    return (
      <Styled.Column>
        <Styled.ColumnHeader>
          <Icon icon="login" />
          Incoming
          <span className="count">{total}</span>
          <span className="hint">
            inputs of this and {count}
            {children.truncated ? '+' : ''} {membersNoun(children.children, count)}
          </span>
          {childrenSwitch}
        </Styled.ColumnHeader>
        {childLinksError ? (
          <Styled.Empty>
            Could not load links: {getRequestErrorString(childLinksError)}
          </Styled.Empty>
        ) : loading && !total ? (
          <Styled.Empty>Loading links…</Styled.Empty>
        ) : !total ? (
          <Styled.Empty>No incoming links</Styled.Empty>
        ) : (
          agg.groups.map((group) => (
            <AggregatedGroupSection
              key={group.key}
              group={group}
              selfId={entityId}
              isManager={isManager}
              onOpenEntity={onOpenEntity}
            />
          ))
        )}
        {(!!agg.internal || children.truncated) && (
          <Styled.Empty>
            {!!agg.internal &&
              `${agg.internal} ${plural('link', agg.internal)} between children not shown. `}
            {children.truncated && `Only the first ${MAX_CHILDREN} children are included.`}
          </Styled.Empty>
        )}
      </Styled.Column>
    )
  }

  const renderColumn = (direction: 'in' | 'out') => {
    if (direction === 'in' && aggregated) return renderChildrenColumn(aggregated)
    // read-only users only see link types that have links
    const columnGroups = groups.filter(
      (g) => g.direction === direction && (g.links.length || (canEdit && g.inAnatomy)),
    )
    const total = columnGroups.reduce((n, g) => n + g.links.length, 0)
    return (
      <Styled.Column>
        <Styled.ColumnHeader>
          <Icon icon={direction === 'in' ? 'login' : 'logout'} />
          {direction === 'in' ? 'Incoming' : 'Outgoing'}
          <span className="count">{total}</span>
          <span className="hint">{direction === 'in' ? 'inputs of this' : 'uses this'}</span>
          {direction === 'in' && childrenSwitch}
        </Styled.ColumnHeader>
        {isLoading && <Styled.Empty>Loading links…</Styled.Empty>}
        {!isLoading && !columnGroups.length && (
          <Styled.Empty>
            No {direction === 'in' ? 'incoming' : 'outgoing'} links
            {canEdit &&
              ` (the project anatomy has no link types ${
                direction === 'in' ? 'into' : 'from'
              } ${entityType}s)`}
          </Styled.Empty>
        )}
        {columnGroups.map((group) => (
          <LinkGroupSection
            key={group.key}
            group={group}
            projectName={projectName}
            entityId={entityId}
            entityType={entityType}
            canEdit={canEdit}
            onOpenEntity={onOpenEntity}
          />
        ))}
      </Styled.Column>
    )
  }

  return (
    <Styled.Body>
      <Styled.Header>
        <Thumbnail
          projectName={projectName}
          entityType={entityType}
          entityId={entityId}
          thumbnailHash={header?.thumbnailHash}
          icon={icon}
          color={color}
        />
        <div className="titles">
          <span className="name">
            <Icon icon={icon} style={{ color }} />
            {header?.name || '…'}
          </span>
          <span className="sub">
            {[entityType, header?.subType, header?.status].filter(Boolean).join(' · ')}
          </span>
          {header?.path && <span className="sub">{header.path}</span>}
        </div>
        {onOpenDetails && (
          <Button icon="info" variant="text" data-tooltip="Open details" onClick={onOpenDetails} />
        )}
      </Styled.Header>
      {error ? (
        <Styled.Empty>Could not load links: {getRequestErrorString(error)}</Styled.Empty>
      ) : view === 'graph' ? (
        <Suspense fallback={<Styled.Empty>Loading graph…</Styled.Empty>}>
          <EntityLinksGraph
            groups={groups}
            entityType={entityType}
            name={header?.name || '…'}
            icon={icon}
            iconColor={color}
            isManager={isManager}
            isLoading={isLoading}
            onOpenEntity={onOpenEntity}
          />
        </Suspense>
      ) : (
        <Styled.Columns>
          {renderColumn('in')}
          {renderColumn('out')}
        </Styled.Columns>
      )}
    </Styled.Body>
  )
}
