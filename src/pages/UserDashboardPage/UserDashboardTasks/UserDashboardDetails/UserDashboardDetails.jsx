import { Panel } from '@ynput/ayon-react-components'
import React, { useMemo } from 'react'
import UserDashDetailsHeader from '../UserDashDetailsHeader/UserDashDetailsHeader'
import { useSelector } from 'react-redux'
import { useGetKanBanUsersQuery } from '/src/services/userDashboard/getUserDashboard'
import Feed from '/src/containers/Feed/Feed'
import getCommentsForTasks from '/src/containers/Feed/commentsData'

const UserDashboardDetails = ({ tasks = [], statusesOptions, disabledStatuses }) => {
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
