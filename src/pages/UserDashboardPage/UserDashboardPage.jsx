import React from 'react'
import AppNavLinks from '/src/containers/header/AppNavLinks'
import { useParams } from 'react-router'
import UserTasks from './UserTasks'

const UserDashboardPage = () => {
  let { module } = useParams()
  const links = [
    {
      name: 'Tasks',
      path: '/dashboard/tasks',
      module: 'tasks',
      accessLevels: [],
    },
  ]

  return (
    <>
      <AppNavLinks links={links} />
      {module === 'tasks' && <UserTasks />}
    </>
  )
}

export default UserDashboardPage
