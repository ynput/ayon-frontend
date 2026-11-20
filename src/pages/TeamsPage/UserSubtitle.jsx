import React from 'react'
import styled from 'styled-components'
import { OverflowField, Button } from '@ynput/ayon-react-components'

const StyledSubtitle = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  min-height: 22px;
`

// a team the user isn't on yet: a small pill that adds them to it
const AddButton = styled(Button)`
  /* doubled: ARC's icon button padding (.hasIcon) weighs two classes */
  && {
    flex: none;
    min-height: 0;
    height: 22px;
    padding: 0 10px 0 6px;
    gap: 2px;
    border-radius: 11px;
    font-size: var(--md-sys-typescale-label-medium-font-size);
    line-height: 1;
  }

  .icon {
    font-size: 16px;
  }
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
          <AddButton
            key={team}
            icon="add"
            data-tooltip={`Add to ${team}`}
            onClick={() => onAddTeam([...teamsValue, team])}
          >
            {team}
          </AddButton>
        ))}
    </StyledSubtitle>
  )
}

export default UserSubtitle
