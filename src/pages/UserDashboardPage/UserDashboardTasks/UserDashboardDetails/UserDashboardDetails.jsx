import { Panel } from '@ynput/ayon-react-components'
import React, { useMemo } from 'react'
import UserDashDetailsHeader from '../UserDashDetailsHeader/UserDashDetailsHeader'
import { useSelector } from 'react-redux'
import Feed from '/src/containers/Feed/Feed'
import { useGetTasksDetailsQuery } from '/src/services/userDashboard/getUserDashboard'
import TaskAttributes from '../TaskAttributes/TaskAttributes'

const UserDashboardDetails = ({
  tasks = [],
  statusesOptions,
  disabledStatuses,
  projectUsers,
  disabledProjectUsers,
  activeProjectUsers,
  selectedTasksProjects,
  projectsInfo,
}) => {
  const selectedTasksIds = useSelector((state) => state.dashboard.tasks.selected)
  const filter = useSelector((state) => state.dashboard.details.filter)

  //   find selected tasks
  const selectedTasks = useMemo(() => {
    if (!selectedTasksIds?.length) return []
    return tasks.filter((task) => selectedTasksIds.includes(task.id))
  }, [selectedTasksIds, tasks])

  // now we get the full details data for selected tasks
  const { data: tasksDetailsData, isFetching: isLoadingTasksDetails } = useGetTasksDetailsQuery(
    { tasks: selectedTasks },
    { skip: !tasks?.length },
  )

  return (
    <Panel
      style={{ gap: 0, height: '100%', padding: 0, boxShadow: '-2px 0 6px #00000047', zIndex: 80 }}
    >
      <UserDashDetailsHeader
        tasks={selectedTasks}
        users={projectUsers}
        disabledProjectUsers={disabledProjectUsers}
        statusesOptions={statusesOptions}
        disabledStatuses={disabledStatuses}
      />
      {filter === 'details' ? (
        <TaskAttributes tasks={tasksDetailsData} isLoading={isLoadingTasksDetails} />
      ) : (
        <Feed
          tasks={selectedTasks}
          activeUsers={activeProjectUsers}
          selectedTasksProjects={selectedTasksProjects}
          projectsInfo={projectsInfo}
          filter={filter}
        />
      )}
    </Panel>
  )
}

export default UserDashboardDetails
