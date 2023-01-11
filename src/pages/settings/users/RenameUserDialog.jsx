import { useState } from 'react'
import { toast } from 'react-toastify'
import { Dialog } from 'primereact/dialog'
import { Button, InputText, FormLayout, FormRow } from '@ynput/ayon-react-components'
import axios from 'axios'

const RenameUserDialog = ({ onHide, selectedUsers }) => {
  const [newName, setNewName] = useState('')

  if (!selectedUsers?.length) {
    // this shouldn't happen
    onHide()
    return <></>
  }

  const oldName = selectedUsers[0]
  const onSubmit = () => {
    axios
      .patch(`/api/users/${oldName}/rename`, { newName })
      .then(() => toast.success('User renamed'))
      .catch(() => toast.error('Unable to rename user'))
      .finally(() => onHide())
  }
  return (
    <Dialog header={`Rename user ${oldName}`} visible={true} onHide={onHide}>
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
