import { useMemo } from 'react'
import * as Styled from './DetailsPanelHeader.styled'
import copyToClipboard from '@helpers/copyToClipboard'
import StackedThumbnails from '@pages/EditorPage/StackedThumbnails'
import { classNames } from 'primereact/utils'
import { isEqual, union, upperFirst } from 'lodash'
import { useUpdateEntitiesMutation } from '@queries/entity/updateEntity'
import { toast } from 'react-toastify'
import Actions from '@containers/Actions/Actions'
import FeedFilters from '../FeedFilters/FeedFilters'
import usePatchProductsListWithVersions from '@hooks/usePatchProductsListWithVersions'

const DetailsPanelHeader = ({
  entityType,
  entitySubTypes,
  entities = [],
  disabledAssignees = [],
  users = [],
  statusesOptions = [],
  disabledStatuses,
  tagsOptions = [],
  onClose,
  isSlideOut,
  isFetching,
  isCompact = false,
}) => {
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

  const handleThumbnailUpload = ({ id, thumbnailId }) => {
    // patching the updatedAt will force a refresh of the thumbnail url
    const newUpdatedAt = new Date().toISOString()
    const entity = entities.find((entity) => entity.id === id)
    const currentAssignees = entity?.users || []
    const operations = [
      { id, projectName, data: { updatedAt: newUpdatedAt, thumbnailId }, currentAssignees },
    ]

    const versionPatch = {
      productId: entity.productId,
      versionUpdatedAt: newUpdatedAt,
      versionThumbnailId: thumbnailId,
    }

    // update productsList cache with new status
    let productsPatch = patchProductsListWithVersions([versionPatch])
    try {
      updateEntities({ operations, entityType })
    } catch (error) {
      productsPatch?.undo()
      productsPatch?.undo()
    }
  }

  const fullPath = firstEntity?.path || ''
  const pathArray = fullPath.split('/')
  const handleCopyPath = () => {
    copyToClipboard(fullPath)
  }

  const portalId = 'dashboard-details-header'

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
    <Styled.Grid id={portalId} className={classNames('details-panel-header', { isCompact })}>
      {onClose && (
        <Styled.CloseButton
          onClick={onClose}
          icon="close"
          variant="text"
          data-shortcut="Esc"
          data-tooltip-delay={0}
        />
      )}
      <Styled.Path
        value={pathArray.join(' / ')}
        align="left"
        onClick={handleCopyPath}
        isCopy
        icon="content_copy"
        className={classNames('path', { onClose, isLoading })}
      />
      <Styled.Header className={classNames('titles', { isCompact })}>
        <StackedThumbnails
          isLoading={isLoading}
          shimmer={isLoading}
          style={{ aspectRatio: '1' }}
          thumbnails={thumbnails}
          projectName={projectName}
          portalId={portalId}
          onUpload={handleThumbnailUpload}
        />
        <Styled.Content className={classNames({ isLoading })}>
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
        className={classNames('status-select', { isLoading })}
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
      <Actions entities={entities} entityType={entityType} entitySubTypes={entitySubTypes} />
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
      />
    </Styled.Grid>
  )
}

export default DetailsPanelHeader
