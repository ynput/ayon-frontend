import React from 'react'
import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import UserTile from '@pages/SettingsPage/UsersSettings/UserTile'
import DashboardPanelWrapper from './DashboardPanelWrapper'
import { useGetTeamsQuery } from '@queries/team/getTeams'
import { Button } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import styled from 'styled-components'
import TeamMembersStacked from '@components/TeamMembersStacked/TeamMembersStacked'

const subTitle = (members, leaders) => {
  let mt = ''
  let lt = ''
  if (members > 0) mt = members + ' member'
  if (members > 1) mt += 's'

  if (leaders > 0) lt = leaders + ' leader'
  if (leaders > 1) lt += 's'

  return `${mt} ${mt && lt && '-'} ${lt}`
}

const StyledTeam = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-large);
  padding: 8px;
  padding-top: 4px;
  border-radius: var(--border-radius);
  overflow: hidden;
  position: relative;

  &,
  a > div {
    background-color: var(--md-sys-color-surface-container);
  }

  &.loading {
    min-height: 100px;
  }
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
    <DashboardPanelWrapper title={`Teams - ${data.length}`}>
      {data.map((team, i) => (
        <StyledTeam key={i} className={clsx({ loading: isFetching })}>
          {!isFetching && (
            <>
              <h2 style={{ position: 'relative' }}>
                {team.name} <span>{subTitle(team.members?.length, team.leaders?.length)}</span>
              </h2>

              {!!team.leaders?.length && (
                <>
                  {team.leaders?.map((leader, i) => (
                    <Link
                      key={`${leader.name}-${i}`}
                      to={`/manageProjects/teams?project=${projectName}&teams=${team.name}&name=${leader.name}`}
                      style={{ position: 'relative' }}
                    >
                      <UserTile
                        userName={leader.name}
                        leaderRoles={leader.roles}
                        isWaiting={isFetching}
                      >
                        leader
                      </UserTile>
                    </Link>
                  ))}
                </>
              )}
              <Link to={`/manageProjects/teams?project=${projectName}&teams=${team.name}`}>
                {!!team.members?.length && (
                  <TeamMembersStacked
                    names={team.members?.map((m) => m.name)}
                    projectName={projectName}
                  />
                )}
              </Link>
            </>
          )}
        </StyledTeam>
      ))}
      {!isFetching && (
        <>
          {!data.length && (
            <h2 style={{ position: 'relative' }}>
              <span>No teams found</span>
            </h2>
          )}
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
