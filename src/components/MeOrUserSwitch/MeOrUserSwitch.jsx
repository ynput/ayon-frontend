import * as Styled from './MeOrUserSwitch.styled'
import { AssigneeSelect, Button } from '@ynput/ayon-react-components'
import { useMemo } from 'react'

const MeOrUserSwitch = ({ value = [], onChange, filter, users = [], ...props }) => {

  const options = useMemo(
    () =>
      users.map((user) => ({
        name: user.name,
        fullName: user.attrib.fullName,
        avatarUrl: `/api/users/${user.name}/avatar`,
      })),
    [users],
  )

  // this is so that the first click on the dropdown will set isMe false but not open the dropdown
  // a second click will open the dropdown
  // or if the there are no assignees selected already
  const handleDropdownClick = () => {
    onChange('users')
  }

  return (
    <Styled.MeOrUserSwitchContainer>
      <Button
        label="Me"
        icon="person"
        className="switch-button me"
        variant="surface"
        selected={filter === 'me'}
        onClick={() => onChange('me')}
        data-tooltip="View my tasks"
      />

      {/* <Button
        label="All"
        className="switch-button all"
        icon={'checklist'}
        data-tooltip="View all tasks"
        selected={filter === 'all'}
        onClick={() => onChange('all')} // empty array means all users
      /> */}

      <AssigneeSelect
        value={value}
        onChange={(v) => onChange('users', v)}
        options={options}
        {...props}
        className={filter === 'users' && 'selected'}
        onClick={handleDropdownClick}
        disableOpen={filter !== 'users' && !!value.length}
        emptyIcon="groups"
        emptyMessage="Assignees"
        style={{ zIndex: 'none' }}
        data-tooltip="View other users tasks"
        onSelectAll
      />
    </Styled.MeOrUserSwitchContainer>
  )
}

export default MeOrUserSwitch
