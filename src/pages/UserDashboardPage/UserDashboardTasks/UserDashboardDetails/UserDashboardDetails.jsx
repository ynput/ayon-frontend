import { Panel } from '@ynput/ayon-react-components'
import React from 'react'
import UserDashDetailsHeader from '../UserDashDetailsHeader/UserDashDetailsHeader'
import { useSelector } from 'react-redux'
import { useGetKanBanUsersQuery } from '/src/services/userDashboard/getUserDashboard'

const UserDashboardDetails = ({ tasks = [] }) => {
  const selectedProjects = useSelector((state) => state.dashboard.selectedProjects)

  const { data: projectUsers } = useGetKanBanUsersQuery(
    { projects: selectedProjects },
    { skip: !selectedProjects?.length },
  )

  return (
    <Panel style={{ height: '100%', padding: 0 }}>
      <UserDashDetailsHeader
        tasks={tasks}
        selectedProjects={selectedProjects}
        users={projectUsers}
      />
    </Panel>
  )
}

export default UserDashboardDetails
