import { UserNode } from '@api/graphql'
import { Icon, UserImagesStacked } from '@ynput/ayon-react-components'
import styled from 'styled-components'
const StyledAssigneesWrapper = styled.div`
  display: flex;
  align-items: center;
  padding: 0 8px;
  height: 100%;
  width: 100%;
`

type Props = {
  assignees: string[]
  allUsers: UserNode[]
  handleExpandIconClick: () => void
}

const AssigneessCellContent = ({ assignees, allUsers, handleExpandIconClick }: Props) => {
  const users = allUsers.filter((user) => assignees.includes(user.name))
  const userIcons = (
    <UserImagesStacked
      users={users.map((user) => ({
        avatarUrl: user.name && `/api/users/${user.name}/avatar`,
      }))}
      gap={-0.25}
      size={20}
    />
  )
  return (
    <StyledAssigneesWrapper onDoubleClick={handleExpandIconClick}>
      <div style={{ display: 'flex', flexGrow: 1 }}>
        {users.length === 1 ? (
          <>
            {userIcons}
            <span style={{ padding: '0 8px' }}>{users[0].name}</span>
          </>
        ) : (
          userIcons
        )}
      </div>
      <Icon icon="expand_more" onClick={handleExpandIconClick} />
    </StyledAssigneesWrapper>
  )
}

export default AssigneessCellContent
