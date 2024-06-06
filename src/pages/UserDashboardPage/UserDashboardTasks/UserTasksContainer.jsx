import { useDispatch, useSelector } from 'react-redux'
import {
  useGetKanBanQuery,
  useGetKanBanUsersQuery,
} from '/src/services/userDashboard/getUserDashboard'

import UserDashboardKanBan from './UserDashboardKanBan'
import { useEffect, useMemo } from 'react'
import { onAssigneesChanged } from '/src/features/dashboard'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import DetailsPanel from '../../../containers/DetailsPanel/DetailsPanel'
import { getIntersectionFields, getMergedFields } from '../util'
import { Section } from '@ynput/ayon-react-components'
import { setUri } from '/src/features/context'
import DetailsPanelSlideOut from '../../../containers/DetailsPanel/DetailsPanelSlideOut/DetailsPanelSlideOut'

export const getThumbnailUrl = ({ entityId, entityType, thumbnailId, updatedAt, projectName }) => {
  if (!projectName || (!thumbnailId && !entityId)) return null

  // fallback on arbitrary thumbnailId if entityId is not available
  // this should never happen, but just in case
  // only admins and managers can see the second endpoint though
  const thumbnailUrl = thumbnailId
    ? `/api/projects/${projectName}/thumbnails/${thumbnailId}?updatedAt=${updatedAt}&placeholder=none`
    : `/api/projects/${projectName}/${entityType}s/${entityId}/thumbnail?updatedAt=${updatedAt}&placeholder=none`

  return thumbnailUrl
}

const UserTasksContainer = ({ projectsInfo = {}, isLoadingInfo }) => {
  const dispatch = useDispatch()
  const selectedProjects = useSelector((state) => state.dashboard.selectedProjects)
  const user = useSelector((state) => state.user)
  const assigneesState = useSelector((state) => state.dashboard.tasks.assignees)
  const assigneesIsMe = useSelector((state) => state.dashboard.tasks.assigneesIsMe)
  // Only admins and managers can see task of other users
  const assignees = assigneesIsMe || user?.data?.isUser ? [user?.name] : assigneesState || []
  const selectedTasks = useSelector((state) => state.dashboard.tasks.selected) || []

  // once user is loaded, set assignees to user
  useEffect(() => {
    if (!assigneesState) {
      dispatch(onAssigneesChanged([user.name]))
    }
  }, [user.name])

  const taskFields = {
    status: { plural: 'statuses', isEditable: true },
    taskType: { plural: 'task_types', isEditable: true },
    folderType: { plural: 'folder_types', isEditable: false },
  }

  //  get kanban tasks for all projects by assigned user (me)
  let {
    data: tasks = [],
    isFetching: isLoadingTasks,
    isError,
    error,
  } = useGetKanBanQuery(
    { assignees: assignees, projects: selectedProjects },
    { skip: !assignees.length || !selectedProjects?.length },
  )

  // update the uri breadcrumbs when the selected tasks change
  useEffect(() => {
    if (selectedTasks.length && !isLoadingTasks) {
      // first find task
      const task = tasks.find((t) => t.id === selectedTasks[0])
      if (!task) return
      // updates the breadcrumbs
      let uri = `ayon+entity://${task.path}?task=${task.name}`

      dispatch(setUri(uri))
    } else {
      dispatch(setUri(null))
    }
  }, [selectedTasks, isLoadingTasks, tasks])

  // filter out tasks that don't have a assignees
  tasks = tasks.filter((task) => task.assignees?.some((assignee) => assignees.includes(assignee)))

  // add icons to tasks and also add thumbnailUrl
  const tasksWithIcons = tasks.map((task) => {
    const thumbnailId = task?.thumbnailId ? task?.thumbnailId : task.latestVersionThumbnailId
    const updatedAt = task?.thumbnailId
      ? task.updatedAt
      : task.latestVersionUpdatedAt ?? task.updatedAt

    const thumbnailUrl = getThumbnailUrl({
      entityId: task.id,
      entityType: 'task',
      thumbnailId,
      updatedAt,
      projectName: task.projectName,
    })

    const updatedTask = { ...task, thumbnailUrl }

    const projectInfo = projectsInfo[task.projectName]
    if (!projectInfo?.statuses) return updatedTask
    const findStatus = projectInfo.statuses?.find((status) => status.name === task.status)
    if (!findStatus) return updatedTask
    const findTaskIcon = projectInfo.task_types?.find((type) => type.name === task.taskType)
    if (!findTaskIcon) return updatedTask
    return {
      ...updatedTask,
      statusIcon: findStatus?.icon,
      statusColor: findStatus?.color,
      taskIcon: findTaskIcon?.icon,
    }
  })

  const selectedTasksData = useMemo(
    () => tasksWithIcons.filter((task) => selectedTasks.includes(task.id)),
    [selectedTasks, tasks],
  )

  // for selected tasks, get flat list of projects
  const selectedTasksProjects = useMemo(
    () => [...new Set(selectedTasksData.map((t) => t.projectName))],
    [selectedTasks, selectedTasksData],
  )

  // we need to get the intersection of all the statuses of the projects for the selected tasks
  // this means that if we have 2 tasks from 2 different projects, we need to get the intersection of the statuses of those 2 projects
  //  and it prevents us from showing statuses that are not available for the selected tasks
  const statusesOptions = useMemo(
    () => getMergedFields(projectsInfo, 'statuses'),
    [projectsInfo, isLoadingInfo],
  )

  const statusesIntersection = useMemo(
    () => getIntersectionFields(projectsInfo, 'statuses', selectedTasksProjects),
    [projectsInfo, selectedTasksProjects],
  )

  const disabledStatuses = useMemo(
    () =>
      statusesOptions
        .filter((s) => !statusesIntersection.some((s2) => s2.name === s.name))
        .map((s) => s.name),
    [projectsInfo, selectedTasksProjects, statusesOptions],
  )

  // find the intersection of all the tags of the projects for the selected tasks
  const tagsOptions = useMemo(
    () => getIntersectionFields(projectsInfo, 'tags', selectedTasksProjects),
    [projectsInfo, selectedTasksProjects],
  )

  const { data: projectUsers = [] } = useGetKanBanUsersQuery(
    { projects: selectedProjects },
    { skip: !selectedProjects?.length },
  )

  // for selected projects, make sure user is on all
  const [activeProjectUsers, disabledProjectUsers] = useMemo(() => {
    if (!selectedTasksProjects?.length) return [projectUsers, []]
    return projectUsers.reduce(
      (acc, user) => {
        if (selectedTasksProjects.every((p) => user.projects.includes(p))) {
          acc[0].push(user)
        } else {
          acc[1].push(user)
        }
        return acc
      },
      [[], []],
    )
  }, [selectedTasksProjects, projectUsers])

  const isLoadingAll = isLoadingInfo || isLoadingTasks
  const detailsMinWidth = 533
  const detailsMaxWidth = '40vw'
  const detailsMaxMaxWidth = 700

  if (isError)
    return (
      <Section style={{ textAlign: 'center' }}>
        <h2>Error: Something went wrong loading your tasks. Try refreshing the page.</h2>
        <span>assignees: {JSON.stringify(assigneesState)}</span>
        <span>assigneesIsMe: {JSON.stringify(assigneesIsMe)}</span>
        <span>selectedProjects: {JSON.stringify(selectedProjects)}</span>
        <span>selectedTasks: {JSON.stringify(selectedTasks)}</span>
        <span>userName: {JSON.stringify(user?.name)}</span>
        <span>error: {JSON.stringify(error)}</span>
      </Section>
    )

  return (
    <Splitter
      layout="horizontal"
      style={{
        height: '100%',
        zIndex: 10,
        overflow: 'hidden',
        width: '100%',
        gap: 0,
        marginLeft: -8,
      }}
      stateKey="user-dashboard-tasks"
      className="dashboard-tasks"
      gutterSize={selectedTasks.length ? 6 : 0}
    >
      <SplitterPanel
        style={{ height: '100%', zIndex: 10, padding: 0, overflow: 'hidden', marginRight: -6 }}
        size={4}
      >
        <UserDashboardKanBan
          tasks={tasksWithIcons}
          isLoading={isLoadingAll}
          projectsInfo={projectsInfo}
          taskFields={taskFields}
          statusesOptions={statusesOptions}
          disabledStatuses={disabledStatuses}
          disabledProjectUsers={disabledProjectUsers}
        />
      </SplitterPanel>
      {selectedTasksData.length ? (
        <SplitterPanel
          size={1}
          style={{
            maxWidth: `clamp(${detailsMinWidth}px, ${detailsMaxWidth}, ${detailsMaxMaxWidth}px)`,
            minWidth: detailsMinWidth,
          }}
        >
          <DetailsPanel
            entitiesData={selectedTasksData}
            statusesOptions={statusesOptions}
            disabledStatuses={disabledStatuses}
            tagsOptions={tagsOptions}
            projectUsers={projectUsers}
            activeProjectUsers={activeProjectUsers}
            disabledProjectUsers={disabledProjectUsers}
            selectedTasksProjects={selectedTasksProjects}
            projectsInfo={projectsInfo}
            projectNames={selectedTasksProjects}
            entityType="task"
            scope="dashboard"
          />
          <DetailsPanelSlideOut projectsInfo={projectsInfo} scope="dashboard" />
        </SplitterPanel>
      ) : (
        <SplitterPanel style={{ maxWidth: 0 }}></SplitterPanel>
      )}
    </Splitter>
  )
}

export default UserTasksContainer
