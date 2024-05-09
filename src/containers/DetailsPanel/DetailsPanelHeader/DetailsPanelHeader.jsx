import { AssigneeSelect, TagsSelect } from '@ynput/ayon-react-components'
import React, { useMemo } from 'react'
import * as Styled from './DetailsPanelHeader.styled'
import copyToClipboard from '/src/helpers/copyToClipboard'
import StackedThumbnails from '/src/pages/EditorPage/StackedThumbnails'
import { classNames } from 'primereact/utils'
import { isEqual, union } from 'lodash'
import { useUpdateEntitiesMutation } from '/src/services/userDashboard/updateUserDashboard'
import { toast } from 'react-toastify'
import Actions from '/src/components/Actions/Actions'
import FeedFilters from '../FeedFilters/FeedFilters'

const DetailsPanelHeader = ({
  entityType,
  entities = [],
  disabledAssignees = [],
  users = [],
  statusesOptions = [],
  disabledStatuses,
  tagsOptions = [],
  onClose,
  isSlideOut,
}) => {
  // for selected entities, get flat list of assignees
  const selectedTasksAssignees = useMemo(
    () => union(...entities.map((entity) => entity.users)),
    [entities],
  )

  const singleEntity = entities[0]
  const projectName = entities.length > 1 ? null : singleEntity?.projectName

  const thumbnails = useMemo(
    () =>
      entities
        .filter((entity, i) => i <= 5)
        .map((entity) => ({
          src: entity.thumbnailUrl,
          icon: entity.icon,
          id: entity.id,
          type: entityType,
          updatedAt: entity.updatedAt,
        })),
    [entities],
  )

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

  const [updateEntities] = useUpdateEntitiesMutation()
  const handleUpdate = async (field, value) => {
    if (value === null || value === undefined) return console.error('value is null or undefined')

    try {
      // build entities operations array
      const operations = entities.map((entity) => ({
        id: entity.id,
        projectName: entity.projectName,
        data: {
          [field]: value,
        },
      }))

      await updateEntities({ operations, entityType })
    } catch (error) {
      toast.error('Error updating' + entityType)
    }
  }

  if (!singleEntity) return null
  const fullPath = singleEntity.path || ''
  const pathArray = fullPath.split('/')
  const handleCopyPath = () => {
    copyToClipboard(fullPath)
  }

  // DUMMY ACTIONS DATA
  const actions = [
    { id: 'nuke', icon: 'nuke.png', pinned: 'actions2D' },
    { id: 'afterEffects', icon: 'after-effects.png', pinned: 'actions2D' },
    { id: 'maya', icon: 'maya.png', pinned: 'actions3D' },
    { id: 'houdini', icon: 'houdini.png', pinned: 'actions3D' },
    { id: 'photoshop', icon: 'photoshop.png' },
  ]

  const actionTaskTypes = {
    actions2D: ['compositing', 'roto', 'matchmove', 'edit', 'paint'],
    actions3D: [
      'modeling',
      'texture',
      'lookdev',
      'rigging',
      'layout',
      'setdress',
      'animation',
      'fx',
      'lighting',
    ],
  }

  const pinned = actions
    .filter((action) => {
      const actions = actionTaskTypes[action.pinned]
      if (!actions) return false
      return actions.some(
        (action) => action.toLowerCase() === singleEntity.entitySubType?.toLowerCase(),
      )
    })
    .map((action) => action.id)

  const portalId = 'dashboard-details-header'

  const hasUser =
    ['task', 'version'].includes(entityType) &&
    (selectedTasksAssignees.length > 0 || entityType === 'task')

  const usersOptions = users.map((u) => u)
  if (hasUser) {
    // check if all users are in options, otherwise add them
    const allUsers = users.map((u) => u.name)
    const usersToAdd = selectedTasksAssignees.filter((u) => !allUsers.includes(u))
    if (usersToAdd.length) {
      usersOptions.push(...usersToAdd.map((u) => ({ name: u, fullName: u })))
    }
  }

  return (
    <Styled.SectionWrapper id={portalId}>
      <Styled.Path
        value={pathArray.join(' / ')}
        align="left"
        onClick={handleCopyPath}
        isCopy
        icon="content_copy"
        className={classNames({ onClose })}
      />
      {onClose && (
        <Styled.CloseButton
          onClick={onClose}
          icon="close"
          variant="text"
          data-shortcut="Esc"
          data-tooltip-delay={0}
        />
      )}
      <Styled.Header>
        <StackedThumbnails
          thumbnails={thumbnails}
          projectName={projectName}
          portalId={portalId}
          onUpload={({ thumbnailId }) => handleUpdate('thumbnailId', thumbnailId)}
        />
        <Styled.Content>
          <h2>{!isMultiple ? singleEntity.title : `${entities.length} ${entityType}s selected`}</h2>
          <h3>{!isMultiple ? singleEntity.subTitle : entities.map((t) => t.name).join(', ')}</h3>
        </Styled.Content>
      </Styled.Header>
      <Styled.Section>
        <Styled.ContentRow>
          <Styled.TaskStatusSelect
            value={statusesValue}
            options={statusesOptions}
            disabledValues={disabledStatuses}
            invert
            style={{ maxWidth: 'unset' }}
            onChange={(value) => handleUpdate('status', value)}
          />
          {hasUser && (
            <AssigneeSelect
              value={selectedTasksAssignees}
              options={usersOptions}
              disabledValues={disabledAssignees.map((u) => u.name)}
              isMultiple={isMultiple && selectedTasksAssignees.length > 1}
              editor={entityType === 'task'}
              align="right"
              onChange={(value) => handleUpdate('assignees', value)}
            />
          )}
        </Styled.ContentRow>
      </Styled.Section>
      <Styled.Section>
        <Styled.ContentRow>
          <Actions options={actions} pinned={pinned} />
          <TagsSelect
            value={union(...tagsValues)}
            isMultiple={tagsValues.some((v) => !isEqual(v, tagsValues[0]))}
            tags={tagsOptionsObject}
            editable
            onChange={(value) => handleUpdate('tags', value)}
            align="right"
          />
        </Styled.ContentRow>
      </Styled.Section>
      <FeedFilters isSlideOut={isSlideOut} />
    </Styled.SectionWrapper>
  )
}

export default DetailsPanelHeader

// {
//   "id": "739af4b83da311eeac5d0242ac120004",
//   "name": "modeling",
//   "status": "In progress",
//   "taskType": "Modeling",
//   "assignees": [
//       "userName"
//   ],
//   "updatedAt": "2023-08-30T15:14:45.427705+00:00",
//   "folderName": "00_kloecksiouys_mccrietsoiwn",
//   "folderId": "739a748e3da311eeac5d0242ac120004",
//   "path": "assets/characters/00_kloecksiouys_mccrietsoiwn",
//   "projectName": "demo_Commercial",
//   "latestVersionThumbnailId": "08b9986c474811eea5d60242ac120004",
//   "thumbnailUrl": "/api/projects/demo_Commercial/thumbnails/08b9986c474811eea5d60242ac120004?updatedAt=2023-08-30T15:14:45.427705+00:00&token=0848587a83cd065914bf9e6c0792bdd246910cbd2ea520115f802d6adbc9e396",
//   "statusIcon": "play_arrow",
//   "statusColor": "#3498db",
//   "taskIcon": "language"
// }
