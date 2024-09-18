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
            disabled={value !== selectedUsersString}
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
          label={`To confirm delete action, type '${selectedUsersString}' in the box below`}
          style={{ flexDirection: 'column', alignItems: 'start', marginTop: '16px' }}
          labelStyle={{ height: 'auto', lineHeight: 'auto' }}
          fieldStyle={{ display: 'block', width: '100%' }}
        >
          <InputText
            style={{ width: '100%' }}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </FormRow>
      </FormLayout>
    </Dialog>
  )
}

export default DeleteUserDialog
