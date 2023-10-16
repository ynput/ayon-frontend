import * as Styled from './MeOrUserSwitch.styled'
import { AssigneeSelect, Button } from '@ynput/ayon-react-components'

const MeOrUserSwitch = ({ value = [], onAssignee, onMe, options = [], isMe, ...props }) => {
  // this is so that the first click on the dropdown will set isMe false but not open the dropdown
  // a second click will open the dropdown
  // or if the there are no assignees selected already
  const handleDropdownClick = () => {
    onAssignee(value)
  }

  return (
    <Styled.MeOrUserSwitchContainer>
      <Button
        label="Me"
        icon="person"
        className="me"
        variant="surface"
        selected={isMe}
        onClick={onMe}
        data-tooltip="View my tasks"
      />

      <AssigneeSelect
        value={value}
        onChange={onAssignee}
        options={options}
        {...props}
        className={!isMe && 'selected'}
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
