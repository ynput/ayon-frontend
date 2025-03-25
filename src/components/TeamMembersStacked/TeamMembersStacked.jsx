import React from 'react'
import { useGetUsersAssigneeQuery } from '@queries/user/getUsers'
import { UserImagesStacked } from '@ynput/ayon-react-components'
import styled from 'styled-components'

const StyledTeamMembersStacked = styled(UserImagesStacked)`
  padding: var(--padding-m);
  border-radius: var(--border-radius);
  cursor: pointer;

  &:hover {
    background-color: var(--md-sys-color-surface-container-high-hover);
  }
`

const TeamMembersStacked = ({ names = [], projectName }) => {
  const { data: users = [] } = useGetUsersAssigneeQuery({ names, projectName })

  return <StyledTeamMembersStacked users={users} />
}

export default TeamMembersStacked
