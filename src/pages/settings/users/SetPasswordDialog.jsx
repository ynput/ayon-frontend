import { useState } from 'react'
import { toast } from 'react-toastify'
import PropTypes from 'prop-types'
import { Dialog } from 'primereact/dialog'

import { Button, InputPassword, FormLayout, FormRow } from '@ynput/ayon-react-components'

import axios from 'axios'

const SetPasswordDialog = ({ onHide, selectedUsers }) => {
  const [password, setPassword] = useState('')

  if (!selectedUsers?.length) {
    // this shouldn't happen
    onHide()
    return <></>
  }

  const userName = selectedUsers[0]
  const onSubmit = () => {
    axios
      .patch(`/api/users/${userName}/password`, { password })
      .then(() => {
        onHide()
        toast.success('Password changed')
      })
      .catch(() => toast.error('Unable to change password'))
  }
  return (
    <Dialog header={`Change user ${userName} password`} visible={true} onHide={onHide}>
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

SetPasswordDialog.PropTypes = {
  onHide: PropTypes.func,
  selectedUsers: PropTypes.array,
}

export default SetPasswordDialog
