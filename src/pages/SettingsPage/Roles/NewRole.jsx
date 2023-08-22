import { FormLayout, FormRow, InputText, SaveButton, Spacer } from '@ynput/ayon-react-components'
import { useMemo, useState } from 'react'
import { useCreateRoleMutation } from '/src/services/roles/updateRoles'
import { toast } from 'react-toastify'
import { Dialog } from 'primereact/dialog'

const NewRole = ({ onClose, rolesList }) => {
  const [roleName, setRoleName] = useState('')
  const [createRole] = useCreateRoleMutation()

  const roleNames = useMemo(() => rolesList.map((i) => i?.name.toLowerCase()), [rolesList])

  const onSubmit = async () => {
    try {
      await createRole({ name: roleName }).unwrap()

      onClose()
    } catch (error) {
      console.error(error)

      toast.error('Unable to create role')
    }
  }

  let error = null
  if (roleNames.includes(roleName.toLowerCase())) error = 'This role already exists'
  else if (!roleName.match('^[a-zA-Z_]{2,20}$')) error = 'Invalid role name'

  const footer = useMemo(
    () => (
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'flex-end',
          marginLeft: 'auto',
        }}
      >
        <Spacer />
        <SaveButton
          label="Create role"
          icon="group_add"
          active={!error && roleName}
          onClick={onSubmit}
        />
      </div>
    ),
    [error, roleName, onSubmit],
  )

  return (
    <Dialog
      header="New role"
      footer={footer}
      onHide={onClose}
      visible={true}
      bodyStyle={{ width: 400, overflow: 'hidden' }}
    >
      <FormLayout>
        <FormRow label="Role name">
          <InputText value={roleName} onChange={(e) => setRoleName(e.target.value)} autoFocus />
        </FormRow>
        <FormRow>{error && !!roleName && <span className="form-error-text">{error}</span>}</FormRow>
      </FormLayout>
    </Dialog>
  )
}

export default NewRole
