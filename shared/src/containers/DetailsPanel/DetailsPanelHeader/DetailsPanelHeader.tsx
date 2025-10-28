import { useMemo, useRef } from 'react'
import { union, upperFirst } from 'lodash'
import clsx from 'clsx'
import { DropdownRef, getTextColor } from '@ynput/ayon-react-components'

import { EntityPanelUploader, StackedThumbnails } from '@shared/components'
import { Actions, DetailsPanelProps } from '@shared/containers'
// shared
import { useGetEntitiesChecklistsQuery, useGetAttributeConfigQuery, Status } from '@shared/api'
import type { DetailsPanelEntityData } from '@shared/api'
import { getPriorityOptions } from '@shared/util'
import { useScopedStatuses, useEntityUpdate } from '@shared/hooks'
import { DetailsPanelTab, useDetailsPanelContext } from '@shared/context'

import FeedFilters from '../FeedFilters/FeedFilters'
import * as Styled from './DetailsPanelHeader.styled'
import getThumbnails from '../helpers/getThumbnails'
import { buildDetailsPanelTitles } from '../helpers/buildDetailsPanelTitles'
import { PlayableIcon } from '@shared/components/PlayableIcon/PlayableIcon'

export type EntityTypeIcons = {
  folder: Record<string, string>
  task: Record<string, string>
  product: Record<string, string>
}

type DetailsPanelHeaderProps = {
  entityType: 'folder' | 'task' | 'version' | 'representation'
  entitySubTypes: string[]
  entities: DetailsPanelEntityData[]
  disabledAssignees?: any[]
  users?: any[]
  disabledStatuses?: string[]
  tagsOptions?: any[]
  isFetching?: boolean
  isCompact?: boolean
  currentTab: DetailsPanelTab
  onTabChange: (tab: DetailsPanelTab) => void
  onOpenViewer: (args: any) => void
  onEntityFocus: DetailsPanelProps['onEntityFocus']
  entityTypeIcons: EntityTypeIcons
}

const DetailsPanelHeader = ({
  entityType,
  entitySubTypes,
  entities = [],
  disabledAssignees = [],
  users = [],
  disabledStatuses,
  tagsOptions = [],
  isFetching,
  isCompact = false,
  currentTab,
  onTabChange,
  entityTypeIcons,
  onOpenViewer,
  onEntityFocus,
}: DetailsPanelHeaderProps) => {
  const { useSearchParams, useNavigate, isDeveloperMode } = useDetailsPanelContext()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const tagsSelectRef = useRef<DropdownRef>(null)

  const statuses = useScopedStatuses(
    entities.map((entity) => entity.projectName),
    [entityType],
  )

  // for selected entities, get flat list of assignees
  const entityUsers: string[] = useMemo(
    () =>
      union(
        ...entities.flatMap((entity) => [
          entity.task?.assignees || [],
          entity.version?.author || [],
        ]),
      ),
    [entities],
  )

  let firstEntity = entities[0]
  // If there's no data return null
  const isLoading = entities.length === 0 || !firstEntity || isFetching
  // placeholder entity
  if (!firstEntity) {
    firstEntity = {
      id: 'placeholder',
      name: 'loading...',
      label: 'loading...',
      entityType,
      status: 'loading',
      projectName: 'loading...',
      tags: [],
      hasReviewables: false,
      attrib: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      path: '',
    }
  }

  const projectName = entities.length > 1 ? undefined : firstEntity?.projectName

  const entityIds = entities
    .filter((e) => e.projectName === firstEntity?.projectName && e.id)
    .map((entity) => entity.id)

  // get checklists count
  const { data: checklistCount } = useGetEntitiesChecklistsQuery(
    {
      projectName: firstEntity?.projectName,
      entityIds,
    },
    { skip: !firstEntity?.projectName || !entityIds.length },
  )
  let checklistsLabel
  if (checklistCount?.total && checklistCount.total > 0) {
    checklistsLabel = `${checklistCount.checked}/${checklistCount.total}`
  }

  // get priorities
  // get priority attribute so we know the colors and icons for each priority
  const { data: priorityAttrib } = useGetAttributeConfigQuery({ attributeName: 'priority' })
  const priorities = getPriorityOptions(priorityAttrib, entityType)

  const thumbnails = useMemo(
    () => getThumbnails(entities, entityType, entityTypeIcons),
    [entities, entityType, entityTypeIcons],
  )

  // we need to get the intersection of all the statuses of the projects for the selected entities
  // this means that if we have 2 entities from 2 different projects, we need to get the intersection of the statuses of those 2 projects
  //  and it prevents us from showing statuses that are not available for the selected entities
  const statusesValue = useMemo(() => entities.map((t) => t.status), [entities])
  const priorityValues = useMemo(() => entities.map((t) => t.attrib?.priority), [entities])
  const tagsValues: string[][] = useMemo(() => entities.map((t) => t.tags), [entities])
  const tagsOptionsObject = useMemo(
    () =>
      tagsOptions.reduce((acc, tag) => {
        acc[tag.name] = tag
        return acc
      }, {}),
    [tagsOptions],
  )

  const isMultiple = entities.length > 1

  const { updateEntity } = useEntityUpdate({
    entities: entities.map((e) => ({
      id: e.id,
      projectName: e.projectName,
      users: e.task?.assignees || [],
      folderId: e.folder?.id,
      productId: e.product?.id,
    })),
    entityType,
  })

  const handleUpdate = (field: string, value: any) => {
    if (value === null || value === undefined) return console.error('value is null or undefined')
    return updateEntity(field, value)
  }

  const handleThumbnailClick = () => {
    let versionIds,
      id = firstEntity.id,
      entityTypeKey = entityType + 'Id'

    if (entityType === 'version' && firstEntity.product?.id) {
      versionIds = [firstEntity.id]
      id = firstEntity.product?.id
      entityTypeKey = 'productId'
    }

    if (id) {
      onOpenViewer({
        [entityTypeKey]: id,
        projectName,
        versionIds,
      })
    }
  }

  const hasUser =
    ['task', 'version', 'representation'].includes(entityType) &&
    (entityUsers.length > 0 || entityType === 'task')

  const usersOptions = users.map((u) => u)
  if (hasUser) {
    // check if all users are in options, otherwise add them
    const allUsers = users.map((u) => u.name)
    const usersToAdd = entityUsers.filter((u) => !allUsers.includes(u))
    if (usersToAdd.length) {
      usersOptions.push(...usersToAdd.map((u) => ({ name: u, fullName: u })))
    }
  }

  // Get title and subtitle from the imported function
  const { title, subTitle } = buildDetailsPanelTitles(entities, entityType)
  const status = statuses?.length!==0 && statuses?.find((status)=>  status.name=== statusesValue[0])
  return (
    <Styled.HeaderContainer>
      <EntityPanelUploader
        entities={entities}
        entityType={entityType}
        projectName={projectName}
        onVersionCreated={(id) => onEntityFocus?.(id, 'version')}
      >
        <Styled.Grid className={clsx('details-panel-header', { isCompact })}>
          <Styled.Header
            className={clsx('titles', { isCompact, loading: isLoading }, 'no-shimmer')}
          >
            <div style={{ position: 'relative' }}>
              <StackedThumbnails
                isLoading={isLoading}
                shimmer={isLoading}
                thumbnails={thumbnails}
                onClick={thumbnails.length === 1 ? handleThumbnailClick : undefined}
                hoverIcon={'play_circle'}
              />
              {!isMultiple && firstEntity?.hasReviewables && <PlayableIcon />}
            </div>
            <Styled.Content className={clsx({ loading: isLoading })}>
              <Styled.Title>
                <h2>{title}</h2>
                <Styled.TagsSelect
                  ref={tagsSelectRef}
                  value={union(...tagsValues)}
                  tags={tagsOptionsObject}
                  options={[]}
                  editable
                  editor
                  onChange={(value) => handleUpdate('tags', value)}
                  align="right"
                  styleDropdown={{ display: isLoading ? 'none' : 'unset' }}
                  className="tags-select"
                  itemClassName="details-tag"
                />
              </Styled.Title>
              <div className="sub-title">
                <span className="entity-type">{upperFirst(entityType)} - </span>
                <h3>{subTitle}</h3>
              </div>
            </Styled.Content>
          </Styled.Header>
          <Styled.StatusSelect
            value={statusesValue}
            options={statuses || []}
            disabledValues={disabledStatuses}
            invert
            style={{ maxWidth: 'unset' }}
            onChange={(value) => handleUpdate('status', value)}
            className={clsx('status-select', { loading: isLoading })}
            align={isCompact ? 'right' : 'left'}
            $textColor={getTextColor(status!==undefined? (status as Status).color: "#OOO")}
          />
          {!isCompact &&
            (!hasUser || isLoading ? (
              <div></div>
            ) : (
              <Styled.AssigneeSelect
                value={entityUsers}
                options={usersOptions}
                disabledValues={disabledAssignees.map((u) => u.name)}
                isMultiple={isMultiple && entityUsers.length > 1 && entityType === 'task'}
                readOnly={entityType !== 'task'}
                emptyMessage={entityType === 'task' ? 'Assign user' : ''}
                align="right"
                onChange={(value) => handleUpdate('assignees', value)}
                className="assignee-select"
                data-tooltip={
                  entityUsers.length ? (entityType === 'task' ? 'Assigned users' : 'Author') : ''
                }
              />
            ))}
          <Actions
            entities={entities}
            entityType={entityType}
            entitySubTypes={entitySubTypes}
            isLoadingEntity={!!isFetching || !!isLoading}
            searchParams={searchParams}
            isDeveloperMode={isDeveloperMode}
            onSetSearchParams={setSearchParams}
            onNavigate={navigate}
          />
          {priorities ? (
            <Styled.PriorityEnumDropdown
              options={priorities}
              placeholder="No priority"
              value={priorityValues}
              onChange={(value) => handleUpdate('attrib', { priority: value[0] })}
              align="right"
            />
          ) : (
            <div style={{ height: 32 }}></div>
          )}
          <FeedFilters
            isLoading={isLoading}
            entityType={entityType}
            className="filters"
            overrides={{
              checklists: {
                label: checklistsLabel,
              },
            }}
            currentTab={currentTab}
            onTabChange={onTabChange}
          />
        </Styled.Grid>
      </EntityPanelUploader>
    </Styled.HeaderContainer>
  )
}

export default DetailsPanelHeader
