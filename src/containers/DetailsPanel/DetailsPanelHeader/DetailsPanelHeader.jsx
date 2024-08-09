import { useMemo, useState } from 'react'
import * as Styled from './DetailsPanelHeader.styled'
import StackedThumbnails from '@pages/EditorPage/StackedThumbnails'
import clsx from 'clsx'
import { isEqual, union, upperFirst } from 'lodash'
import { useUpdateEntitiesMutation } from '@queries/entity/updateEntity'
import { toast } from 'react-toastify'
import Actions from '@containers/Actions/Actions'
import FeedFilters from '../FeedFilters/FeedFilters'
import usePatchProductsListWithVersions from '@hooks/usePatchProductsListWithVersions'
import { useGetChecklistsCountQuery } from '@queries/activities/getActivities'
import ThumbnailUploader from '@components/ThumbnailUploader/ThumbnailUploader'
import { useDispatch } from 'react-redux'
import { openViewer } from '@state/viewer'
import { Icon } from '@ynput/ayon-react-components'

const DetailsPanelHeader = ({
  entityType,
  entitySubTypes,
  entities = [],
  disabledAssignees = [],
  users = [],
  statusesOptions = [],
  disabledStatuses,
  tagsOptions = [],
  isSlideOut,
  isFetching,
  isCompact = false,
  scope,
}) => {
  const dispatch = useDispatch()

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

  const thumbnails = useMemo(() => {
    if (!entities[0]) return []

    if (entityType === 'representation') return [{ icon: 'view_in_ar' }]

    return entities.slice(0, 6).map((entity) => ({
      icon: entity.icon,
      id: entity.id,
      type: entityType,
      updatedAt: entity.updatedAt,
    }))
  }, [entities, entityType])

  // we need to get the intersection of all the statuses of the projects for the selected entities
  // this means that if we have 2 entities from 2 different projects, we need to get the intersection of the statuses of those 2 projects
  //  and it prevents us from showing statuses that are not available for the selected entities
  const statusesValue = useMemo(() => entities.map((t) => t.status), [entities])
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

  const patchProductsListWithVersions = usePatchProductsListWithVersions({
    projectName: firstEntity?.projectName,
  })

  const patchProductsVersions = (field, value) => {
    // patches = entitiesData but with field and value set for all entities
    let productsPatch
    // if the type is version and the is field is status or version, patch products list
    // because the version status/version is also shown in the product list
    if (entityType === 'version' && ['status'].includes(field)) {
      const versions = entities.map((version) => ({
        productId: version.productId,
        versionId: version.id,
        versionStatus: value,
      }))

      // update productsList cache with new status
      productsPatch = patchProductsListWithVersions(versions)
    }

    return productsPatch
  }

  const [updateEntities] = useUpdateEntitiesMutation()
  const handleUpdate = async (field, value) => {
    if (value === null || value === undefined) return console.error('value is null or undefined')

    // if the type is version and the field is status or version, patch products list
    // mainly used in the browser
    const productsPatch = patchProductsVersions(field, value)
    try {
      // build entities operations array
      const operations = entities.map((entity) => ({
        id: entity.id,
        projectName: entity.projectName,
        data: {
          [field]: value,
        },
        currentAssignees: entity.users,
      }))

      await updateEntities({ operations, entityType })
    } catch (error) {
      toast.error('Error updating' + entityType)
      productsPatch?.undo()
    }
  }

  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const handleThumbnailUpload = (thumbnails = []) => {
    // always set isDraggingFile to false
    // hides the thumbnail uploader
    setIsDraggingFile(false)

    // check something was actually uploaded
    if (!entities.length) return
    // patching the updatedAt will force a refresh of the thumbnail url
    const newUpdatedAt = new Date().toISOString()

    let operations = [],
      versionPatches = []

    for (const entity of thumbnails) {
      const entityToPatch = entities.find((e) => e.id === entity.id)
      if (!entityToPatch) continue
      const thumbnailId = entity.thumbnailId
      const currentAssignees = entity.users || []

      operations.push({
        id: entityToPatch.id,
        projectName: entityToPatch.projectName,
        data: { updatedAt: newUpdatedAt },
        currentAssignees,
      })

      const versionPatch = {
        productId: entityToPatch.productId,
        versionUpdatedAt: newUpdatedAt,
        versionThumbnailId: thumbnailId,
      }

      versionPatches.push(versionPatch)
    }

    // update productsList cache with new status
    let productsPatch = patchProductsListWithVersions(versionPatches)
    try {
      updateEntities({ operations, entityType })
    } catch (error) {
      productsPatch?.undo()
    }
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

    console.log(entityTypeKey)

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
    <Styled.Grid
      className={clsx('details-panel-header', { isCompact })}
      onDragEnter={() => setIsDraggingFile(true)}
    >
      <Styled.Header className={clsx('titles', { isCompact, loading: isLoading }, 'no-shimmer')}>
        <Styled.ThumbnailWrapper>
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
        </Styled.ThumbnailWrapper>
        <Styled.Content className={clsx({ loading: isLoading })}>
          <h2>{!isMultiple ? firstEntity?.title : `${entities.length} ${entityType}s selected`}</h2>
          <div className="sub-title">
            <span>{upperFirst(entityType)} - </span>
            <h3>{!isMultiple ? firstEntity?.subTitle : entities.map((t) => t.title).join(', ')}</h3>
          </div>
        </Styled.Content>
      </Styled.Header>
      <Styled.StatusSelect
        value={statusesValue}
        options={statusesOptions}
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
              entityAssignees.length ? (entityType === 'task' ? 'Assigned users' : 'Author') : ''
            }
          />
        ))}
      <Actions
        entities={entities}
        entityType={entityType}
        entitySubTypes={entitySubTypes}
        isLoadingEntity={isFetching || isLoading}
      />
      <Styled.TagsSelect
        value={union(...tagsValues)}
        isMultiple={tagsValues.some((v) => !isEqual(v, tagsValues[0]))}
        tags={tagsOptionsObject}
        editable
        onChange={(value) => handleUpdate('tags', value)}
        align="right"
        styleDropdown={{ display: isLoading && 'none' }}
        className="tags-select"
      />
      <FeedFilters
        isSlideOut={isSlideOut}
        isLoading={isLoading}
        entityType={entityType}
        className="filters"
        overrides={{
          checklists: {
            label: checklistsLabel,
          },
        }}
        scope={scope}
      />

      {isDraggingFile && (
        <ThumbnailUploader
          isPortal
          onFinish={handleThumbnailUpload}
          onDragLeave={() => setIsDraggingFile(false)}
          onDragOver={(e) => e.preventDefault()}
          className="thumbnail-uploader"
          entities={entities}
          entityType={entityType}
          entityId={firstEntity?.id}
          entityUpdatedAt={firstEntity?.updatedAt}
        />
      )}
    </Styled.Grid>
  )
}

export default DetailsPanelHeader
