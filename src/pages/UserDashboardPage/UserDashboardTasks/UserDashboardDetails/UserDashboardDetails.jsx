import { Panel } from '@ynput/ayon-react-components'
import React, { useMemo } from 'react'
import UserDashDetailsHeader from '../UserDashDetailsHeader/UserDashDetailsHeader'
import { useSelector } from 'react-redux'
import { useGetKanBanUsersQuery } from '/src/services/userDashboard/getUserDashboard'
import Feed from '/src/containers/Feed/Feed'

const UserDashboardDetails = ({ tasks = [] }) => {
  const selectedProjects = useSelector((state) => state.dashboard.selectedProjects)
  const selectedTasksIds = useSelector((state) => state.dashboard.tasks.selected)
  const attributesOpen = useSelector((state) => state.dashboard.tasks.attributesOpen)

  const { data: projectUsers } = useGetKanBanUsersQuery(
    { projects: selectedProjects },
    { skip: !selectedProjects?.length },
  )

  //   find selected tasks
  const selectedTasks = useMemo(() => {
    if (!selectedTasksIds?.length) return []
    return tasks.filter((task) => selectedTasksIds.includes(task.id))
  }, [selectedTasksIds, tasks])

  // for selected tasks, get flat list of projects
  const selectedTasksProjects = useMemo(
    () => [...new Set(tasks.map((t) => t.projectName))],
    [tasks],
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

  return (
    <Panel style={{ height: '100%', padding: 0 }}>
      <UserDashDetailsHeader
        tasks={selectedTasks}
        selectedProjects={selectedProjects}
        users={projectUsers}
        disabledProjectUsers={disabledProjectUsers}
        selectedTasksProjects={selectedTasksProjects}
        attributesOpen={attributesOpen}
      />
      {!attributesOpen && (
        <Feed
          tasks={selectedTasks}
          activeUsers={activeProjectUsers}
          selectedTasksProjects={selectedTasksProjects}
          allTasks={tasks}
          allUsers={projectUsers}
        />
      )}
    </Panel>
  )
}

export default UserDashboardDetails
