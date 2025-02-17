import { useState } from 'react'
import { InputText, FormLayout, FormRow, Dialog, Button } from '@ynput/ayon-react-components'
import InfoMessage from '@components/InfoMessage'

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

  const selectedUsersString = selectedUsers.join(', ')
  const confirmDeleteUsersString = selectedUsers.length > 1 ? "delete selected" : selectedUsersString
  return (
    <Dialog
      size="md"
      header={`Delete ${selectedUsersString} Users`}
      footer={
        <>
          <Button label={selectedUsers.length > 1 ? 'Disable users' : 'Disable user'} onClick={onDisable} />
          <Button
            variant="danger"
            label="Delete"
            onClick={onDelete}
            disabled={value !== confirmDeleteUsersString}
          />
        </>
      }
      isOpen={true}
      onClose={onHide}
    >
      <FormLayout>
        <InfoMessage
          variant="warning"
          message="Deleting users can have unintended consequences. Consider deactivating the user instead?"
        />
        <FormRow
          label={`To confirm delete action, type '${confirmDeleteUsersString}' in the box below`}
          style={{ flexDirection: 'column', alignItems: 'start', marginTop: '16px' }}
          labelStyle={{ height: 'auto', lineHeight: 'auto' }}
          fieldStyle={{ display: 'block', width: '100%' }}
        >
          <InputText
            style={{ width: '100%' }}
            data-testid="delete-user-dialog-input"
            value={value}
            placeholder={confirmDeleteUsersString}
            onChange={(e) => setValue(e.target.value)}
          />
        </FormRow>
      </FormLayout>
    </Dialog>
  )
}

export default DeleteUserDialog
