import { useDispatch, useSelector } from 'react-redux'
import {
  useGetKanBanQuery,
  useGetProjectsInfoQuery,
} from '/src/services/userDashboard/getUserDashboard'
import { Panel, Section } from '@ynput/ayon-react-components'

import UserDashboardKanBan from './UserDashboardKanBan'
import { useEffect } from 'react'
import { onAssigneesChanged } from '/src/features/dashboard'

const UserTasksContainer = () => {
  const dispatch = useDispatch()
  const selectedProjects = useSelector((state) => state.dashboard.selectedProjects)
  const user = useSelector((state) => state.user)
  const assigneesState = useSelector((state) => state.dashboard.tasks.assignees)
  const assignees = assigneesState || (user?.name && [user?.name]) || []

  // once user is loaded, set assignees to user
  useEffect(() => {
    if (!assigneesState) {
      dispatch(onAssigneesChanged([user.name]))
    }
  }, [user.name])

  const taskFields = {
    status: { plural: 'statuses', isEditable: true },
    taskType: { plural: 'task_types', isEditable: true },
    folderName: { plural: 'folder_names', isEditable: false },
  }

  // get all the info required for the projects selected, like status icons and colours
  const { data: projectsInfo = {}, isFetching: isLoadingInfo } = useGetProjectsInfoQuery(
    { projects: selectedProjects, fields: Object.values(taskFields).map((t) => t.plural) },
    { skip: !selectedProjects?.length },
  )

  //  get kanban tasks for all projects by assigned user (me)
  const { data: tasks = [], isFetching: isLoadingTasks } = useGetKanBanQuery(
    { assignees: assignees, projects: selectedProjects },
    { skip: !assignees.length || !selectedProjects?.length },
  )

  const tasksWithIcons = tasks.map((task) => {
    const projectInfo = projectsInfo[task.projectName]
    if (!projectInfo?.statuses) return task
    const findStatus = projectInfo.statuses?.find((status) => status.name === task.status)
    if (!findStatus) return task
    const findTaskIcon = projectInfo.task_types?.find((type) => type.name === task.taskType)
    if (!findTaskIcon) return task
    return {
      ...task,
      statusIcon: findStatus?.icon,
      statusColor: findStatus?.color,
      taskIcon: findTaskIcon?.icon,
    }
  })

  const isLoadingAll = isLoadingInfo || isLoadingTasks

  return (
    <Section
      style={{
        height: '100%',
        zIndex: 10,
        overflow: 'hidden',
        gap: 0,
        marginLeft: -8,
      }}
      direction="row"
    >
      <UserDashboardKanBan
        tasks={tasksWithIcons}
        isLoading={isLoadingAll}
        projectsInfo={projectsInfo}
        assignees={assignees}
        taskFields={taskFields}
      />
      <Section style={{ width: 200, height: '100%' }}>
        <Panel style={{ height: '100%' }}>
          <h2>Details Panel</h2>
        </Panel>
      </Section>
    </Section>
  )
}

export default UserTasksContainer
