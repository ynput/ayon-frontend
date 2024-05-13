import React from 'react'
import styled from 'styled-components'
import { OverflowField, Button } from '@ynput/ayon-react-components'

const StyledSubtitle = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  height: 20px;
`

const AddButton = styled(Button)`
  min-height: unset;
  padding: 1px 0;
  padding-right: 4px;
  gap: 0;
`

const UserSubtitle = ({ users, teams, onAddTeam, teamsValue }) => {
  const subTitle =
    users.length > 1
      ? users.map((user) => user.name).join(', ')
      : teamsValue.length
      ? teamsValue.join(', ')
      : 'No team'

  const teamsUserNotIn = teams.filter((team) => !teamsValue.includes(team))

  return (
    <StyledSubtitle>
      <OverflowField value={subTitle} align="left" />
      {users.length === 1 &&
        !!teamsUserNotIn.length &&
        teamsUserNotIn.map((team) => (
          <AddButton key={team} icon="add" onClick={() => onAddTeam([...teamsValue, team])}>
            {team}
          </AddButton>
        ))}
    </StyledSubtitle>
  )
}

export default UserSubtitle
