import { useGetUsersAssigneeQuery } from '@shared/api'
import { UserImagesStacked, UserImagesStackedProps } from '@ynput/ayon-react-components'
import styled from 'styled-components'

const StyledTeamMembersStacked = styled(UserImagesStacked)`
  padding: var(--padding-m);
  border-radius: var(--border-radius);
  cursor: pointer;

  &:hover {
    background-color: var(--md-sys-color-surface-container-high-hover);
  }
`

interface TeamMembersStackedProps extends Omit<UserImagesStackedProps, 'users'> {
  names: string[]
  projectName: string
}

const TeamMembersStacked = ({ names = [], projectName, ...props }: TeamMembersStackedProps) => {
  const { data: users = [] } = useGetUsersAssigneeQuery({ names, projectName })

  return <StyledTeamMembersStacked users={users} {...props} />
}

export default TeamMembersStacked
