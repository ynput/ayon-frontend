import { useState } from 'react'
import { toast } from 'react-toastify'
import { Button, InputText, FormLayout, FormRow, Dialog } from '@ynput/ayon-react-components'
import { useUpdateUserNameMutation } from '/src/services/user/updateUser'

const RenameUserDialog = ({ onHide, selectedUsers, onSuccess }) => {
  const [newName, setNewName] = useState('')

  // mutation hook
  const [updateUserName] = useUpdateUserNameMutation()

  if (!selectedUsers?.length) {
    // this shouldn't happen
    onHide()
    return <></>
  }

  const name = selectedUsers[0]
  const onSubmit = async () => {
    try {
      await updateUserName({ name: name, newName }).unwrap()

      toast.success(`Renamed ${name} -> ${newName}`)

      onSuccess(newName)
    } catch (error) {
      console.error(error)
      toast.error('Unable to rename user: ' + name)
    }

    onHide()
  }

  return (
    <Dialog size="md" style={{ maxWidth: 400 }} header={`Set username for: ${name}`} isOpen={true} onClose={onHide}>
      <FormLayout>
        <FormRow label="New name">
          <InputText value={newName} onChange={(e) => setNewName(e.target.value)} />
        </FormRow>
        <FormRow>
          <Button label="Rename" onClick={onSubmit} />
        </FormRow>
      </FormLayout>
    </Dialog>
  )
}

export default RenameUserDialog
