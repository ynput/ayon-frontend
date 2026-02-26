import { useState } from 'react'
import { FormLayout, Dialog, Button } from '@ynput/ayon-react-components'
import InfoMessage from '@components/InfoMessage'
import * as Styled from './DeleteUserDialog.styled'

type DeleteUserDialogProps = {
  onHide: () => void
  selectedUsers: string[]
  onDelete: () => void
  onDisable: () => void
}

const DeleteUserDialog = ({ onHide, selectedUsers, onDelete, onDisable }: DeleteUserDialogProps) => {
  const [value, setValue] = useState('')

  if (!selectedUsers?.length) {
    // this shouldn't happen
    onHide()
    return <></>
  }

  const isSingle = selectedUsers.length === 1
  const confirmDeleteUsersString = isSingle ? selectedUsers[0] : 'delete selected'

  const header = isSingle
    ? `Delete ${selectedUsers[0]}`
    : `Delete ${selectedUsers.length} Users`

  return (
    <Dialog
      size="md"
      header={header}
      footer={
        <Styled.FooterContainer>
          <Styled.FooterLabel>
            To confirm delete action, type '{confirmDeleteUsersString}' in the box below
          </Styled.FooterLabel>
          <Styled.ConfirmInput
            data-testid="delete-user-dialog-input"
            value={value}
            placeholder={confirmDeleteUsersString}
            onChange={(e) => setValue(e.target.value)}
          />
          <Styled.FooterActions>
            <Button label={isSingle ? 'Disable user' : 'Disable users'} onClick={onDisable} />
            <Button
              variant="danger"
              label="Delete"
              onClick={onDelete}
              disabled={value !== confirmDeleteUsersString}
            />
          </Styled.FooterActions>
        </Styled.FooterContainer>
      }
      isOpen={true}
      onClose={onHide}
    >
      <FormLayout>
        <InfoMessage
          variant="warning"
          message="Deleting users can have unintended consequences. Consider deactivating the user instead?"
        />
        {!isSingle && (
          <div>
            {selectedUsers.map((user) => (
              <div key={user}>{user}</div>
            ))}
          </div>
        )}
      </FormLayout>
    </Dialog>
  )
}

export default DeleteUserDialog
