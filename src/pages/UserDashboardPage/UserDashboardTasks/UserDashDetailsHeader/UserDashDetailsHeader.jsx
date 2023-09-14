import {
  AssigneeSelect,
  Button,
  OverflowField,
  Section,
  Spacer,
} from '@ynput/ayon-react-components'
import React, { useMemo } from 'react'
import { useDispatch } from 'react-redux'
import * as Styled from './UserDashDetailsHeader.styled'
import copyToClipboard from '/src/helpers/copyToClipboard'
import StackedThumbnails from '/src/pages/EditorPage/StackedThumbnails'
import {
  useGetProjectsInfoQuery,
  useGetTasksDetailsQuery,
} from '/src/services/userDashboard/getUserDashboard'
import { getIntersectionFields, getMergedFields } from '../../util'
import { union } from 'lodash'
import { useUpdateTasksMutation } from '/src/services/userDashboard/updateUserDashboard'
import { toast } from 'react-toastify'
import Actions from '/src/components/Actions/Actions'
import { onAttributesOpenChanged } from '/src/features/dashboard'
import TaskAttributes from '../TaskAttributes/TaskAttributes'

const UserDashDetailsHeader = ({
  tasks = [],
  selectedProjects = [],
  selectedTasksProjects = [],
  disabledProjectUsers,
  users = [],
  attributesOpen,
}) => {
  const dispatch = useDispatch()
  const setAttributesOpen = (value) => dispatch(onAttributesOpenChanged(value))

  const { data: projectsInfo = {} } = useGetProjectsInfoQuery(
    { projects: selectedProjects },
    { skip: !selectedProjects?.length },
  )

  // now we get the full details data for selected tasks
  const { data: tasksDetailsData, isFetching: isLoadingTasksDetails } = useGetTasksDetailsQuery(
    { tasks: tasks },
    { skip: !tasks?.length },
  )

  // for selected tasks, get flat list of assignees
  const selectedTasksAssignees = useMemo(() => union(...tasks.map((t) => t.assignees)), [tasks])

  const singleTask = tasks[0]

  const thumbnails = useMemo(
    () =>
      tasks
        .filter((t, i) => i <= 5)
        .map((t) => ({
          src: t.thumbnailUrl,
          icon: t.taskIcon,
        })),
    [tasks],
  )

  // we need to get the intersection of all the statuses of the projects for the selected tasks
  // this means that if we have 2 tasks from 2 different projects, we need to get the intersection of the statuses of those 2 projects
  //  and it prevents us from showing statuses that are not available for the selected tasks
  const statusesValue = useMemo(() => tasks.map((t) => t.status), [tasks])
  const statusesOptions = useMemo(() => getMergedFields(projectsInfo, 'statuses'), [projectsInfo])
  const StatusesOptionsIntersect = useMemo(
    () =>
      selectedProjects.length > 1
        ? getIntersectionFields(projectsInfo, 'statuses', selectedTasksProjects)
        : statusesOptions,
    [projectsInfo, selectedTasksProjects],
  )

  // all statuses that are not in the intersection of the statuses of the selected tasks
  const disabledStatuses = useMemo(
    () =>
      statusesOptions
        .filter((s) => !StatusesOptionsIntersect.some((s2) => s2.name === s.name))
        .map((s) => s.name),
    [statusesOptions, StatusesOptionsIntersect],
  )

  const isMultiple = tasks.length > 1

  const [updateTasks] = useUpdateTasksMutation()
  const handleUpdate = async (field, value) => {
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

  return (
    <Section
      style={{
        padding: 8,
        alignItems: 'flex-start',
        gap: 8,
        borderBottom: !attributesOpen ? '1px solid var(--md-sys-color-outline-variant)' : 'none',
        flex: 'none',
        overflow: 'hidden',
        height: attributesOpen ? '100%' : 'unset',
      }}
    >
      <OverflowField
        value={pathArray.join(' / ')}
        align="left"
        onClick={handleCopyPath}
        isCopy
        icon="content_copy"
        style={{ zIndex: 100 }}
      />
      <Styled.Header>
        <StackedThumbnails thumbnails={thumbnails} />
        <Styled.Content>
          <h2>{!isMultiple ? singleTask.folderName : `${tasks.length} tasks selected`}</h2>
          <h3>{!isMultiple ? singleTask.name : tasks.map((t) => t.name).join(', ')}</h3>
        </Styled.Content>
      </Styled.Header>
      <Styled.StatusAssignees>
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
      </Styled.StatusAssignees>
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
      {attributesOpen && (
        <TaskAttributes tasks={tasksDetailsData} isLoading={isLoadingTasksDetails} />
      )}
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
