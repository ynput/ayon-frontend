import { useDispatch, useSelector } from 'react-redux'
import { useGetKanBanQuery } from '/src/services/userDashboard/getUserDashboard'

import UserDashboardKanBan from './UserDashboardKanBan'
import { useEffect } from 'react'
import { onAssigneesChanged } from '/src/features/dashboard'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import UserDashboardDetails from './UserDashboardDetails/UserDashboardDetails'

const UserTasksContainer = ({ projectsInfo = {}, isLoadingInfo }) => {
  const dispatch = useDispatch()
  const selectedProjects = useSelector((state) => state.dashboard.selectedProjects)
  const user = useSelector((state) => state.user)
  const assigneesState = useSelector((state) => state.dashboard.tasks.assignees)
  const assigneesIsMe = useSelector((state) => state.dashboard.tasks.assigneesIsMe)
  const assignees = assigneesIsMe ? [user?.name] : assigneesState || []

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

  //  get kanban tasks for all projects by assigned user (me)
  let { data: tasks = [], isFetching: isLoadingTasks } = useGetKanBanQuery(
    { assignees: assignees, projects: selectedProjects },
    { skip: !assignees.length || !selectedProjects?.length },
  )

  // filter out tasks that don't have a assignees
  tasks = tasks.filter((task) => task.assignees?.some((assignee) => assignees.includes(assignee)))

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
  const detailsMinWidth = 400
  const detailsMaxWidth = '40vw'
  const detailsMaxMaxWidth = 700

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
      gutterSize={6}
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
        />
      </SplitterPanel>
      <SplitterPanel
        size={1}
        style={{
          maxWidth: `clamp(${detailsMinWidth}px, ${detailsMaxWidth}, ${detailsMaxMaxWidth}px)`,
          minWidth: detailsMinWidth,
        }}
      >
        <UserDashboardDetails tasks={tasksWithIcons} />
      </SplitterPanel>
    </Splitter>
  )
}

export default UserTasksContainer
