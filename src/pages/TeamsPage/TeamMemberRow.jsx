import { Icon } from '@ynput/ayon-react-components'
import styled from 'styled-components'
import { ProfileRow } from '@pages/SettingsPage/UsersSettings/UserList'

const StyledMemberRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  min-width: 0;

  .missing {
    flex-shrink: 0;
    font-size: 18px;
    color: var(--md-sys-color-warning);
  }
`

// a member that is not listed for the project (deleted, or without access to it) keeps the normal
// name colour, with a warning icon that says why
const TeamMemberRow = ({ rowData }) => {
  if (!rowData.isMissing) return <ProfileRow rowData={rowData} />

  return (
    <StyledMemberRow>
      <ProfileRow rowData={{ ...rowData, isMissing: false, missingReason: undefined }} />
      <Icon icon="warning" className="missing" data-tooltip={rowData.missingReason} />
    </StyledMemberRow>
  )
}

export default TeamMemberRow
