import { Panel } from '@ynput/ayon-react-components'
import React, { useMemo } from 'react'
import UserDashDetailsHeader from '../UserDashDetailsHeader/UserDashDetailsHeader'
import { useSelector } from 'react-redux'
import Feed from '/src/containers/Feed/Feed'
import getCommentsForTasks from '/src/containers/Feed/commentsData'

const UserDashboardDetails = ({
  tasks = [],
  statusesOptions,
  disabledStatuses,
  projectUsers,
  disabledProjectUsers,
  activeProjectUsers,
  selectedTasksProjects,
}) => {
  const selectedTasksIds = useSelector((state) => state.dashboard.tasks.selected)
  const attributesOpen = useSelector((state) => state.dashboard.tasks.attributesOpen)

  //   find selected tasks
  const selectedTasks = useMemo(() => {
    if (!selectedTasksIds?.length) return []
    return tasks.filter((task) => selectedTasksIds.includes(task.id))
  }, [selectedTasksIds, tasks])

  const commentsData = useMemo(() => getCommentsForTasks(tasks, projectUsers), [tasks])

  return (
    <Panel style={{ height: '100%', padding: 0 }}>
      <UserDashDetailsHeader
        tasks={selectedTasks}
        users={projectUsers}
        disabledProjectUsers={disabledProjectUsers}
        attributesOpen={attributesOpen}
        statusesOptions={statusesOptions}
        disabledStatuses={disabledStatuses}
      />
      {(!attributesOpen || !selectedTasks.length) && (
        <Feed
          tasks={selectedTasks}
          activeUsers={activeProjectUsers}
          selectedTasksProjects={selectedTasksProjects}
          commentsData={commentsData}
        />
      )}
    </Panel>
  )
}

export default UserDashboardDetails
