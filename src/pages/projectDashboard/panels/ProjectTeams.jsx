import React from 'react'
import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import UserTile from '../../settings/users/UserTile'
import DashboardPanelWrapper from './DashboardPanelWrapper'

import { useGetTeamsQuery } from '/src/services/getTeams'

const demoData = [
  {
    name: 'Management',
    membersCount: 10,
    leaders: [
      {
        attrib: {
          fullName: 'Fabian Hennel',
          avatarUrl: 'https://avatars.githubusercontent.com/u/1001?v=4',
        },
        name: 'fabian',
        roles: { demo_Big_Episodic: ['executive producer', 'creative director'] },
      },
      {
        attrib: {
          fullName: 'Sophie Lee',
          avatarUrl: 'https://avatars.githubusercontent.com/u/1002?v=4',
        },
        name: 'sophie',
        roles: { demo_Big_Episodic: ['production manager'] },
      },
      {
        attrib: {
          fullName: 'Eric Nguyen',
          avatarUrl: 'https://avatars.githubusercontent.com/u/1003?v=4',
        },
        name: 'eric',
        roles: { demo_Big_Episodic: ['finance director'] },
      },
      {
        attrib: {
          fullName: 'Olivia Baker',
          avatarUrl: 'https://avatars.githubusercontent.com/u/1004?v=4',
        },
        name: 'olivia',
        roles: { demo_Big_Episodic: ['HR director'] },
      },
    ],
  },
  {
    name: 'Compositing',
    membersCount: 20,
    leaders: [
      {
        attrib: {
          fullName: 'Benjamin Liu',
          avatarUrl: 'https://avatars.githubusercontent.com/u/1005?v=4',
        },
        name: 'benjamin',
        roles: { demo_Big_Episodic: ['compositing supervisor'] },
      },
    ],
  },
  {
    name: 'Animation',
    membersCount: 30,
    leaders: [
      {
        attrib: {
          fullName: 'Avery Jones',
          avatarUrl: 'https://avatars.githubusercontent.com/u/1006?v=4',
        },
        name: 'avery',
        roles: { demo_Big_Episodic: ['animation director'] },
      },
      {
        attrib: {
          fullName: 'Nathan Kim',
          avatarUrl: 'https://avatars.githubusercontent.com/u/1007?v=4',
        },
        name: 'nathan',
        roles: { demo_Big_Episodic: ['animation supervisor'] },
      },
    ],
  },
  {
    name: 'Lighting',
    membersCount: 15,
    leaders: [
      {
        attrib: {
          fullName: 'Michelle Chen',
          avatarUrl: 'https://avatars.githubusercontent.com/u/1008?v=4',
        },
        name: 'michelle',
        roles: { demo_Big_Episodic: ['lighting director'] },
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
  let { data = [], isError } = useGetTeamsQuery({ projectName })

  let useDemo
  useDemo = true

  if (useDemo) {
    data = demoData
    isError = false
  }

  return (
    <DashboardPanelWrapper isError={isError} title={`Teams - ${data.length}`}>
      {data.map(
        (team, i) =>
          !!team.leaders.length && (
            <Fragment key={i}>
              <h2>
                <span>{team.name}</span>
                <span>{subTitle(team.membersCount, team.leaders.length)}</span>
              </h2>
              {team.leaders.map((leader, i) => (
                <Link key={`${leader.name}-${i}`} to={`/settings/users?name=${leader.name}`}>
                  <UserTile user={leader} />
                </Link>
              ))}
            </Fragment>
          ),
      )}
    </DashboardPanelWrapper>
  )
}

export default ProjectTeams
