import { useState } from 'react'
import { toast } from 'react-toastify'
import PropTypes from 'prop-types'
import { Dialog } from 'primereact/dialog'

import { Button, InputPassword, FormLayout, FormRow } from '@ynput/ayon-react-components'

import { useUpdateUserPasswordMutation } from '/src/services/user/updateUser'

const SetPasswordDialog = ({ onHide, selectedUsers }) => {
  const [password, setPassword] = useState('')

  // mutation hook
  const [updateUserPassword] = useUpdateUserPasswordMutation()

  if (!selectedUsers?.length) {
    // this shouldn't happen
    onHide()
    return <></>
  }

  const name = selectedUsers[0]
  const onSubmit = async () => {
    try {
      await updateUserPassword({ name, password }).unwrap()
      // SUCCESS
      onHide()
      toast.success('Password changed')
    } catch (error) {
      // FAIL
      console.error(error)
      toast.error('Unable to change password')
    }
  }
  return (
    <Dialog header={`Set password for: ${name} `} visible={true} onHide={onHide}>
      <FormLayout>
        <FormRow label="New password">
          <InputPassword value={password} onChange={(e) => setPassword(e.target.value)} />
        </FormRow>
        <FormRow>
          <Button label="Set password" onClick={onSubmit} />
        </FormRow>
      </FormLayout>
    </Dialog>
  )
}

SetPasswordDialog.propTypes = {
  onHide: PropTypes.func,
  selectedUsers: PropTypes.array,
}

export default SetPasswordDialog
