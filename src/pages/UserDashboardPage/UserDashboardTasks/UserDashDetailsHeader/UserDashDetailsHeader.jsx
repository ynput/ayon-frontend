import { AssigneeSelect, Button, Section, Spacer } from '@ynput/ayon-react-components'
import React, { useMemo } from 'react'
import { useDispatch } from 'react-redux'
import * as Styled from './UserDashDetailsHeader.styled'
import copyToClipboard from '/src/helpers/copyToClipboard'
import StackedThumbnails from '/src/pages/EditorPage/StackedThumbnails'

import { union } from 'lodash'
import { useUpdateTasksMutation } from '/src/services/userDashboard/updateUserDashboard'
import { toast } from 'react-toastify'
import Actions from '/src/components/Actions/Actions'
import { onAttributesOpenChanged } from '/src/features/dashboard'

const UserDashDetailsHeader = ({
  tasks = [],
  disabledProjectUsers,
  users = [],
  attributesOpen,
  statusesOptions,
  disabledStatuses,
}) => {
  const dispatch = useDispatch()
  const setAttributesOpen = (value) => dispatch(onAttributesOpenChanged(value))

  // for selected tasks, get flat list of assignees
  const selectedTasksAssignees = useMemo(() => union(...tasks.map((t) => t.assignees)), [tasks])

  const singleTask = tasks[0]
  const projectName = tasks.length > 1 ? null : singleTask.projectName

  const thumbnails = useMemo(
    () =>
      tasks
        .filter((t, i) => i <= 5)
        .map((t) => ({
          src: t.thumbnailUrl,
          icon: t.taskIcon,
          id: t.id,
          type: 'task',
        })),
    [tasks],
  )

  // we need to get the intersection of all the statuses of the projects for the selected tasks
  // this means that if we have 2 tasks from 2 different projects, we need to get the intersection of the statuses of those 2 projects
  //  and it prevents us from showing statuses that are not available for the selected tasks
  const statusesValue = useMemo(() => tasks.map((t) => t.status), [tasks])

  const isMultiple = tasks.length > 1

  const [updateTasks] = useUpdateTasksMutation()
  const handleUpdate = async (field, value) => {
    if (value === null || value === undefined) return console.error('value is null or undefined')

    try {
      // build tasks operations array
      const tasksOperations = tasks.map((task) => ({
        id: task.id,
        projectName: task.projectName,
        data: {
          [field]: value,
        },
      }))

      await updateTasks({ operations: tasksOperations })
    } catch (error) {
      toast.error('Error updating task(s)')
    }
  }

  if (!singleTask) return null
  const fullPath = singleTask.path + '/' + singleTask.name
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
      return actions.some((action) => action.toLowerCase() === singleTask.taskType.toLowerCase())
    })
    .map((action) => action.id)

  const portalId = 'dashboard-details-header'

  return (
    <Section
      style={{
        padding: 8,
        alignItems: 'flex-start',
        gap: 8,
        borderBottom: '1px solid var(--md-sys-color-outline-variant)',
        flex: 'none',
        overflow: 'hidden',
      }}
      id={portalId}
    >
      <Styled.Path
        value={pathArray.join(' / ')}
        align="left"
        onClick={handleCopyPath}
        isCopy
        icon="content_copy"
        style={{ zIndex: 100 }}
      />
      <Styled.Header>
        <StackedThumbnails
          thumbnails={thumbnails}
          projectName={projectName}
          portalId={portalId}
          onUpload={({ thumbnailId }) => handleUpdate('thumbnailId', thumbnailId)}
        />
        <Styled.Content>
          <h2>
            {!isMultiple
              ? singleTask.folderLabel || singleTask.folderName
              : `${tasks.length} tasks selected`}
          </h2>
          <h3>
            {!isMultiple
              ? singleTask.label || singleTask.name
              : tasks.map((t) => t.name).join(', ')}
          </h3>
        </Styled.Content>
      </Styled.Header>
      <Styled.StatusAssigned>
        <Styled.ContentRow>
          <label>Status</label>
          <label>Assigned</label>
        </Styled.ContentRow>
        <Styled.ContentRow>
          <Styled.TaskStatusSelect
            value={statusesValue}
            options={statusesOptions}
            disabledValues={disabledStatuses}
            invert
            style={{ maxWidth: 'unset' }}
            onChange={(value) => handleUpdate('status', value)}
          />
          <AssigneeSelect
            value={isMultiple ? selectedTasksAssignees : singleTask.assignees}
            options={users}
            disabledValues={disabledProjectUsers.map((u) => u.name)}
            isMultiple={isMultiple && selectedTasksAssignees.length > 1}
            editor
            align="right"
            onChange={(value) => handleUpdate('assignees', value)}
          />
        </Styled.ContentRow>
      </Styled.StatusAssigned>
      <Styled.Footer>
        <Actions options={actions} pinned={pinned} />
        <Spacer />
        <Button
          icon={attributesOpen ? 'forum' : 'segment'}
          onClick={() => setAttributesOpen(!attributesOpen)}
          label={attributesOpen ? 'Activity' : 'Details'}
          iconProps={{ style: { transform: !attributesOpen ? 'scaleX(-1)' : '' } }}
        />
      </Styled.Footer>
    </Section>
  )
}

export default UserDashDetailsHeader

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
//   "latestVersionId": "73c080f23da311eeac5d0242ac120004",
//   "latestVersionThumbnailId": "08b9986c474811eea5d60242ac120004",
//   "thumbnailUrl": "/api/projects/demo_Commercial/thumbnails/08b9986c474811eea5d60242ac120004?updatedAt=2023-08-30T15:14:45.427705+00:00&token=0848587a83cd065914bf9e6c0792bdd246910cbd2ea520115f802d6adbc9e396",
//   "statusIcon": "play_arrow",
//   "statusColor": "#3498db",
//   "taskIcon": "language"
// }
