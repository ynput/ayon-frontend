import React from 'react'
import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import UserTile from '/src/pages/SettingsPage/UsersSettings/UserTile'
import DashboardPanelWrapper from './DashboardPanelWrapper'
import { useGetTeamsQuery } from '../../../services/team/getTeams'
import { Button } from '@ynput/ayon-react-components'
import getShimmerStyles from '/src/styles/getShimmerStyles'
import styled from 'styled-components'

const subTitle = (members, leaders) => {
  let mt = ''
  let lt = ''
  if (members > 0) mt = members + ' member'
  if (members > 1) mt += 's'

  if (leaders > 0) lt = leaders + ' leader'
  if (leaders > 1) lt += 's'

  return `${mt} ${mt && '-'} ${lt}`
}

const StyledLoading = styled.div`
  position: absolute;
  inset: 8px;
  height: 26px;
  background-color: var(--color-grey-01);
  border-radius: var(--border-radius);
  ${getShimmerStyles()}
`

const ProjectTeams = ({ projectName }) => {
  let { data = [], isFetching } = useGetTeamsQuery({ projectName })

  if (isFetching) {
    const dummyTeam = {
      isLoading: true,
      leaders: [
        {
          isLoading: true,
        },
      ],
    }
    // create 3 dummy teams
    data = [dummyTeam, dummyTeam, dummyTeam]
  }

  return (
    <DashboardPanelWrapper
      title={`Teams - ${data.length}`}
      header={isFetching && <StyledLoading />}
    >
      {data.map(
        (team, i) =>
          !!team.leaders.length && (
            <Fragment key={i}>
              <h2 style={{ position: 'relative' }}>
                <span>{team.name}</span>
                <span>{subTitle(team.memberCount - team.leaders.length, team.leaders.length)}</span>
                {team.isLoading && <StyledLoading style={{ inset: 0 }} />}
              </h2>
              {team.leaders.map((leader, i) => (
                <Link
                  key={`${leader.name}-${i}`}
                  to={`/manageProjects/teams?project=${projectName}&teams=${team.name}&name=${leader.name}`}
                  style={{ position: 'relative' }}
                >
                  <UserTile
                    userName={leader.name}
                    leaderRoles={leader.roles}
                    isWaiting={isFetching}
                  />
                </Link>
              ))}
            </Fragment>
          ),
      )}
      {!isFetching && !data.length && (
        <>
          <h2 style={{ position: 'relative' }}>
            <span>No teams found</span>
          </h2>
          <Link to={`/manageProjects/teams?project=${projectName}`}>
            <Button style={{ width: '100%', maxHeight: 'unset', height: 36 }} icon="group_add">
              Create new team
            </Button>
          </Link>
        </>
      )}
    </DashboardPanelWrapper>
  )
}

export default ProjectTeams
