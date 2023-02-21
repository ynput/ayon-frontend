import React from 'react'
import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import UserTile from '../../settings/users/UserTile'
import DashboardPanelWrapper from './DashboardPanelWrapper'
import { useGetTeamsQuery } from '/src/services/getTeams'

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

  // no teams return null
  if (!data.length) return null

  return (
    <DashboardPanelWrapper isError={isError} title={`Teams - ${data.length}`}>
      {data.map(
        (team, i) =>
          !!team.leaders.length && (
            <Fragment key={i}>
              <h2>
                <span>{team.name}</span>
                <span>{subTitle(team.memberCount - team.leaders.length, team.leaders.length)}</span>
              </h2>
              {team.leaders.map((leader, i) => (
                <Link key={`${leader.name}-${i}`} to={`/settings/users?name=${leader.name}`}>
                  <UserTile userName={leader.name} leaderRoles={leader.roles} />
                </Link>
              ))}
            </Fragment>
          ),
      )}
    </DashboardPanelWrapper>
  )
}

export default ProjectTeams
