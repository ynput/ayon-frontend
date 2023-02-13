import React from 'react'
import UserTile from '/src/pages/settings/users/UserTile'
import DashboardPanelWrapper from './DashboardPanelWrapper'
import ListStatsTile from './ListStatsTile'
import { useGetProjectDashboardQuery } from '/src/services/getProjectDashboard'
import { useNavigate } from 'react-router'
import { Fragment } from 'react'

const ProjectUsers = ({ projectName }) => {
  const navigator = useNavigate()

  let {
    data = {},
    isLoading,
    isError,
  } = useGetProjectDashboardQuery({ projectName, panel: 'users' })

  const { active = 0, total = 0, counts = {}, managers = [], leaders = [] } = data

  const title = `Users - ${total} - ${active} Active`

  return (
    <DashboardPanelWrapper
      title={title}
      isError={isError}
      icon={{ link: '/settings/users', icon: 'manage_accounts' }}
    >
      {leaders.map((user, i) => (
        <Fragment key={i}>
          <h2>{user?.attrib?.position}</h2>
          <UserTile
            user={user}
            style={{ width: '100%' }}
            onClick={() => navigator(`/settings/users?name=${user.name}`)}
          />
        </Fragment>
      ))}
      {!!managers.length && (
        <>
          <h2>Managers</h2>
          {managers.map((user, i) => (
            <UserTile
              key={i}
              user={user}
              style={{ width: '100%' }}
              onClick={() => navigator(`/settings/users?name=${user.name}`)}
            />
          ))}
        </>
      )}
      <h2>Roles</h2>
      {Object.entries(counts).map(([role, stat], i) => (
        <ListStatsTile key={i} title={role} stat={stat} isLoading={isLoading} />
      ))}
    </DashboardPanelWrapper>
  )
}

export default ProjectUsers
