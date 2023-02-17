import React from 'react'
import { Fragment } from 'react'
import DashboardPanelWrapper from './DashboardPanelWrapper'

import { useGetTeamsQuery } from '/src/services/getTeams'

const demoData = [
  {
    name: 'Management',
    membersCount: 0,
    leaders: [
      {
        fullName: 'Aaron Dunne',
        name: 'aaron',
        avatarUrl: 'https://avatars.githubusercontent.com/u/1001?v=4',
        roles: ['director', 'producer'],
      },
      {
        roles: ['Producer'],
        fullName: 'Evon Sloss',
        name: 'john',
        avatarUrl: 'https://avatars.githubusercontent.com/u/1002?v=4',
      },
      {
        roles: ['VFX Supervisor'],
        fullName: 'Fabian Hennel',
        name: 'fab',
        avatarUrl: 'https://avatars.githubusercontent.com/u/1003?v=4',
      },
    ],
  },
  {
    name: 'Compositing',
    membersCount: 13,
    leaders: [
      {
        roles: ['VFX Supervisor'],
        fullName: 'Fabian Hennel',
        name: 'fab',
        avatarUrl: 'https://avatars.githubusercontent.com/u/1003?v=4',
      },
    ],
  },
  {
    name: 'Animation',
    membersCount: 20,
    leaders: [
      {
        roles: ['CG Director'],
        fullName: 'Fabian Hennel',
        name: 'fab',
        avatarUrl: 'https://avatars.githubusercontent.com/u/1004?v=4',
      },
      {
        roles: ['Animation Supervisor'],
        fullName: 'Fabian Hennel',
        name: 'fab',
        avatarUrl: 'https://avatars.githubusercontent.com/u/1005?v=4',
      },
    ],
  },
  {
    name: 'Lighting',
    membersCount: 5,
    leaders: [
      {
        roles: ['Lighting Lead'],
        fullName: 'Fabian Hennel',
        name: 'fab',
        avatarUrl: 'https://avatars.githubusercontent.com/u/1006?v=4',
      },
    ],
  },
]

const subTitle = (members, leaders) => {
  let mt = ''
  let lt = ''
  if (members > 0) mt = members + ' member'
  if (members > 1) mt += 's'

  if (leaders > 0) lt = leaders + ' leader'
  if (leaders > 1) lt += 's'

  return `${mt} ${mt && '-'} ${lt}`
}

const ProjectTeams = ({ projectName }) => {
  let { data, isError } = useGetTeamsQuery({ projectName })

  data = demoData

  return (
    <DashboardPanelWrapper isError={isError} title={`Teams ${data.count}`}>
      {data.map(
        (team, i) =>
          !!team.leaders.length && (
            <Fragment key={i}>
              <h2>
                <span>{team.name}</span>
                <span>{subTitle(team.membersCount, team.leaders.length)}</span>
              </h2>
            </Fragment>
          ),
      )}
    </DashboardPanelWrapper>
  )
}

export default ProjectTeams
