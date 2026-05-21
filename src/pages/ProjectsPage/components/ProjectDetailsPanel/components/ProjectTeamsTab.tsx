import React, { FC, useMemo } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { Button, Icon, UserImagesStacked } from '@ynput/ayon-react-components'
import {
  useGetTeamsQuery,
  TeamListItemModel,
  useGetUsersAssigneeQuery,
  Assignee,
} from '@shared/api'

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  overflow-y: auto;
  flex: 1;
`

const StyledTeamCard = styled(Link)`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: var(--border-radius);
  background-color: var(--md-sys-color-surface-container);
  text-decoration: none;
  color: inherit;
  transition: background-color 0.15s;

  &:hover {
    background-color: var(--md-sys-color-surface-container-hover);
  }

  &.loading {
    height: 52px;
    pointer-events: none;
  }
`

const StyledTeamInfo = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  gap: 2px;
`

const StyledTeamName = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: var(--md-sys-color-on-surface);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const StyledLeaders = styled.span`
  font-size: 11px;
  color: var(--md-sys-color-on-surface-variant);
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const StyledNoTeams = styled.div`
  padding: 16px;
  text-align: center;
  color: var(--md-sys-color-on-surface-variant);
  font-size: 13px;
`

interface ProjectTeamsTabProps {
  projectName: string
}

const ProjectTeamsTab: FC<ProjectTeamsTabProps> = ({ projectName }) => {
  const { data = [], isFetching } = useGetTeamsQuery({ projectName })

  const teams: TeamListItemModel[] = isFetching
    ? Array.from({ length: 3 }, (_, i) => ({ name: `loading-${i}`, memberCount: 0 }))
    : data

  const allTeamsUsers = teams.reduce((acc, team) => {
    const members = team.members?.map((m) => m.name) || []
    return [...acc, ...members]
  }, [] as string[])

  const { data: users = [] } = useGetUsersAssigneeQuery({ names: allTeamsUsers, projectName })
  const usersMaps: Map<string, Assignee> = useMemo(() => {
    const map = new Map<string, Assignee>()
    users.forEach((u: any) => {
      map.set(u.name, u)
    })
    return map
  }, [users])

  const getTeamUsers = (names: string[]) => {
    const teamUsers: Assignee[] = []
    names.forEach((n) => {
      const user = usersMaps.get(n)
      if (user) teamUsers.push(user)
    })
    return teamUsers
  }

  return (
    <StyledContainer>
      {!isFetching && (
        <>
          {!data.length && <StyledNoTeams>No teams created yet</StyledNoTeams>}
          <Link to={`/manageProjects/teams?project=${projectName}`}>
            <Button
              style={{ width: '100%', maxHeight: 'unset', height: 34, marginTop: 4 }}
              icon="group_add"
            >
              Manage teams
            </Button>
          </Link>
        </>
      )}
      {teams.map((team, i) => (
        <StyledTeamCard
          key={team.name || i}
          to={`/manageProjects/teams?project=${projectName}&teams=${team.name}`}
          className={isFetching ? 'loading shimmer' : ''}
        >
          {!isFetching && (
            <>
              <StyledTeamInfo>
                <StyledTeamName>{team.name}</StyledTeamName>
                {team.leaders && team.leaders.length > 0 ? (
                  <StyledLeaders>
                    <Icon icon="star" style={{ fontSize: 16 }} filled />
                    {getTeamUsers(team.leaders.map((l) => l.name))
                      .map((l) => l.fullName || l.name)
                      .join(', ')}
                  </StyledLeaders>
                ) : (
                  <StyledLeaders style={{ fontStyle: 'italic' }}>No leaders</StyledLeaders>
                )}
              </StyledTeamInfo>

              {team.members && team.members.length > 0 && (
                <UserImagesStacked
                  users={getTeamUsers(team.members.map((m) => m.name))}
                  size={22}
                />
              )}
            </>
          )}
        </StyledTeamCard>
      ))}
    </StyledContainer>
  )
}

export default ProjectTeamsTab
