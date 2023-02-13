import React from 'react'
import UserTile from '/src/pages/settings/users/UserTile'
import DashboardPanelWrapper from './DashboardPanelWrapper'
import ListStatsTile from './ListStatsTile'
import { useGetProjectDashboardQuery } from '/src/services/getProjectDashboard'
import { useNavigate } from 'react-router'
import { useState } from 'react'
import { useEffect } from 'react'
import { Fragment } from 'react'

const usersDemo = {
  active: 10,
  total: 53,
  leaders: [
    {
      name: 'don',
      isManager: true,
      isAdmin: false,
      attrib: {
        fullName: 'Don Draper',
        avatarUrl: '...',
        position: 'Director',
      },
    },
    {
      name: 'peggy',
      isManager: true,
      isAdmin: false,
      attrib: {
        fullName: 'Peggy Olson',
        avatarUrl: null,
        position: 'VFX Supervisor',
      },
    },
  ],
  managers: [
    {
      name: 'betty',
      isManager: true,
      attrib: {
        fullName: 'Betty Draper',
        avatarUrl:
          'https://nofilmschool.com/sites/default/files/styles/facebook/public/betty.png?itok=qThJfpyk',
        position: null,
      },
    },
    {
      name: 'roger',
      isManager: true,
      attrib: {
        fullName: 'Roger Sterling',
        avatarUrl: 'https://upload.wikimedia.org/wikipedia/en/4/42/Roger_Sterling.jpg',
        position: null,
      },
    },
  ],

  roles: {
    artists: 35,
    editors: 5,
    viewers: 2,
  },
}

const ProjectUsers = ({ projectName }) => {
  const navigator = useNavigate()
  //   fake loading time
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState({})
  useEffect(() => {
    const timeout = setTimeout(() => {
      setData(usersDemo)
      setIsLoading(false)
    }, 1000)
    return () => {
      clearTimeout(timeout)
    }
  }, [])

  let {
    // data = {},
    // isLoading,
    isError,
  } = useGetProjectDashboardQuery({ projectName, panel: 'users' })

  const { active = 0, total = 0, roles = {}, managers = [{}], leaders = [{}] } = data

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
      <h2>Managers</h2>
      {managers.map((user, i) => (
        <UserTile
          key={i}
          user={user}
          style={{ width: '100%' }}
          onClick={() => navigator(`/settings/users?name=${user.name}`)}
        />
      ))}
      <h2>Roles</h2>
      {Object.entries(roles).map(([role, stat], i) => (
        <ListStatsTile key={i} title={role} stat={stat} isLoading={isLoading} />
      ))}
    </DashboardPanelWrapper>
  )
}

export default ProjectUsers
