import { useState } from 'react'
import { toast } from 'react-toastify'
import { InputText, FormLayout, FormRow, Dialog, SaveButton } from '@ynput/ayon-react-components'
import { useUpdateUserNameMutation } from '@queries/user/updateUser'
import InfoMessage from '@components/InfoMessage'

type RenameUserDialogProps = {
  onHide: () => void
  selectedUsers: string[]
  onSuccess: (newName: string) => void
}

const RenameUserDialog = ({ onHide, selectedUsers, onSuccess }: RenameUserDialogProps) => {
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
    <Dialog
      size="md"
      style={{ maxWidth: 400 }}
      header={`Set username for: ${name}`}
      footer={<SaveButton label="Rename" onClick={onSubmit} active={!!newName} />}
      isOpen={true}
      onClose={onHide}
    >
      <FormLayout>
        <FormRow label="New name">
          <InputText value={newName} onChange={(e) => setNewName(e.target.value)} />
        </FormRow>
        <InfoMessage
          variant="warning"
          message="Renaming users can have unintended consequences. Use with extreme caution and as a last resort"
        />
      </FormLayout>
    </Dialog>
  )
}

export default RenameUserDialog
