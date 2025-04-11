import { useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import { union, upperFirst } from 'lodash'
import clsx from 'clsx'
import { Icon } from '@ynput/ayon-react-components'

import EntityThumbnailUploader from '@components/EntityThumbnailUploader/EntityThumbnailUploader'
import Actions from '@containers/Actions/Actions'
import useEntityUpdate from '@hooks/useEntityUpdate'
import StackedThumbnails from '@components/Thumbnail/StackedThumbnails'
import { useGetChecklistsCountQuery } from '@queries/activities/getActivities'
import { openViewer } from '@state/viewer'

import FeedFilters from '../FeedFilters/FeedFilters'
import * as Styled from './DetailsPanelHeader.styled'
import getThumbnails from '../helpers/getThumbnails'
import useScopedStatuses from '@hooks/useScopedStatuses'
import { useGetAttributeConfigQuery } from '@queries/attributes/getAttributes'
import { getPriorityOptions } from '@pages/TasksProgressPage/helpers'

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
  scope,
  statePath,
}) => {
  const dispatch = useDispatch()

  const statuses = useScopedStatuses(
    entities.map((entity) => entity.projectName),
    [entityType],
  )

  // for selected entities, get flat list of assignees
  const entityAssignees = useMemo(
    () => union(...entities.map((entity) => entity.users)),
    [entities],
  )

  let firstEntity = entities[0]
  // If there's no data return null
  const isLoading = entities.length === 0 || !firstEntity || isFetching
  // placeholder entity
  if (!firstEntity) {
    firstEntity = {
      id: 'placeholder',
      entityType,
      icon: 'sync',
      title: 'loading...',
      subTitle: 'loading...',
    }
  }

  const projectName = entities.length > 1 ? null : firstEntity?.projectName

  const entityIds = entities
    .filter((e) => e.projectName === firstEntity?.projectName && e.id)
    .map((entity) => entity.id)

  // get checklists count
  const { data: checklistCount = {} } = useGetChecklistsCountQuery(
    {
      projectName: firstEntity?.projectName,
      entityIds,
    },
    { skip: !firstEntity?.projectName || !entityIds.length },
  )
  let checklistsLabel
  if (checklistCount.total > 0) {
    checklistsLabel = `${checklistCount.checked}/${checklistCount.total}`
  }

  // get priorities
  // get priority attribute so we know the colors and icons for each priority
  const { data: priorityAttrib } = useGetAttributeConfigQuery({ attributeName: 'priority' })
  const priorities = getPriorityOptions(priorityAttrib, entityType)

  const thumbnails = useMemo(() => getThumbnails(entities, entityType), [entities, entityType])

  // we need to get the intersection of all the statuses of the projects for the selected entities
  // this means that if we have 2 entities from 2 different projects, we need to get the intersection of the statuses of those 2 projects
  //  and it prevents us from showing statuses that are not available for the selected entities
  const statusesValue = useMemo(() => entities.map((t) => t.status), [entities])
  const priorityValues = useMemo(() => entities.map((t) => t.attrib?.priority), [entities])
  const tagsValues = useMemo(() => entities.map((t) => t.tags), [entities])
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
    entities,
    entityType,
    projectName,
  })

  const handleUpdate = (field, value) => {
    if (value === null || value === undefined) return console.error('value is null or undefined')
    return updateEntity(field, value)
  }

  const handleThumbnailClick = () => {
    let versionIds,
      id = firstEntity.id,
      entityTypeKey = entityType + 'Id'

    if (entityType === 'version') {
      versionIds = [firstEntity.id]
      id = firstEntity.productId
      entityTypeKey = 'productId'
    }

    if (id) {
      dispatch(
        openViewer({
          [entityTypeKey]: id,
          projectName,
          versionIds,
        }),
      )
    }
  }

  const hasUser =
    ['task', 'version', 'representation'].includes(entityType) &&
    (entityAssignees.length > 0 || entityType === 'task')

  const usersOptions = users.map((u) => u)
  if (hasUser) {
    // check if all users are in options, otherwise add them
    const allUsers = users.map((u) => u.name)
    const usersToAdd = entityAssignees.filter((u) => !allUsers.includes(u))
    if (usersToAdd.length) {
      usersOptions.push(...usersToAdd.map((u) => ({ name: u, fullName: u })))
    }
  }

  return (
    <Styled.HeaderContainer>
      <EntityThumbnailUploader
        entities={entities}
        entityType={entityType}
        projectName={projectName}
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
                projectName={projectName}
                onClick={thumbnails.length === 1 ? handleThumbnailClick : undefined}
                hoverIcon={'play_circle'}
              />
              {!isMultiple && firstEntity?.hasReviewables && (
                <Styled.Playable className="playable">
                  <Icon icon="play_circle" />
                </Styled.Playable>
              )}
            </div>
            <Styled.Content className={clsx({ loading: isLoading })}>
              <Styled.Title>
                <h2>{!isMultiple ? firstEntity?.title : `${entities.length} ${entityType}s`}</h2>
                <Styled.TagsSelect
                  value={union(...tagsValues)}
                  tags={tagsOptionsObject}
                  editable
                  editor
                  onChange={(value) => handleUpdate('tags', value)}
                  align="right"
                  styleDropdown={{ display: isLoading && 'none' }}
                  className="tags-select"
                />
              </Styled.Title>
              <div className="sub-title">
                <span className="entity-type">{upperFirst(entityType)} - </span>
                <h3>
                  {!isMultiple ? firstEntity?.subTitle : entities.map((t) => t.title).join(', ')}
                </h3>
              </div>
            </Styled.Content>
          </Styled.Header>
          <Styled.StatusSelect
            value={statusesValue}
            options={statuses}
            disabledValues={disabledStatuses}
            invert
            style={{ maxWidth: 'unset' }}
            onChange={(value) => handleUpdate('status', value)}
            className={clsx('status-select', { loading: isLoading })}
            align={isCompact ? 'right' : 'left'}
          />
          {!isCompact &&
            (!hasUser || isLoading ? (
              <div></div>
            ) : (
              <Styled.AssigneeSelect
                value={entityAssignees}
                options={usersOptions}
                disabledValues={disabledAssignees.map((u) => u.name)}
                isMultiple={isMultiple && entityAssignees.length > 1 && entityType === 'task'}
                readOnly={entityType !== 'task'}
                emptyMessage={entityType === 'task' ? 'Assign user' : ''}
                align="right"
                onChange={(value) => handleUpdate('assignees', value)}
                className="assignee-select"
                data-tooltip={
                  entityAssignees.length
                    ? entityType === 'task'
                      ? 'Assigned users'
                      : 'Author'
                    : ''
                }
              />
            ))}
          <Actions
            entities={entities}
            entityType={entityType}
            entitySubTypes={entitySubTypes}
            isLoadingEntity={isFetching || isLoading}
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
            scope={scope}
            statePath={statePath}
          />
        </Styled.Grid>
      </EntityThumbnailUploader>
    </Styled.HeaderContainer>
  )
}

export default DetailsPanelHeader
