import * as Styled from './MeOrUserSwitch.styled'
import { AssigneeSelect, Button } from '@ynput/ayon-react-components'
import getEntityTypeIcon from '/src/helpers/getEntityTypeIcon'

const MeOrUserSwitch = ({ value = [], onChange, options = [], isMe, isAll, ...props }) => {
  // this is so that the first click on the dropdown will set isMe false but not open the dropdown
  // a second click will open the dropdown
  // or if the there are no assignees selected already
  const handleDropdownClick = () => {
    onChange('users', value)
  }

  return (
    <Styled.MeOrUserSwitchContainer>
      <Button
        label="Me"
        icon="person"
        className="button me"
        variant="surface"
        selected={isMe}
        onClick={onChange('me')}
        data-tooltip="View my tasks"
      />

      <Button
        label="All"
        className="button all"
        icon={getEntityTypeIcon('task')}
        data-tooltip="View all tasks"
        selected={isAll}
        onClick={() => onChange('all')} // empty array means all users
      />

      <AssigneeSelect
        value={value}
        onChange={(v) => onChange('users', v)}
        options={[{ name: 'all', fullName: 'All users' }, ...options]}
        {...props}
        className={!isMe && !isAll && 'selected'}
        onClick={handleDropdownClick}
        disableOpen={isMe && !!value.length}
        emptyIcon="groups"
        emptyMessage="Assignees"
        style={{ zIndex: 'none' }}
        data-tooltip="View other users tasks"
      />
    </Styled.MeOrUserSwitchContainer>
  )
}

export default MeOrUserSwitch
