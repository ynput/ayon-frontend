import { FormLayout, FormRow, InputText, SaveButton, Spacer, Dialog } from '@ynput/ayon-react-components'
import { useMemo, useState } from 'react'
import { useCreateAccessGroupMutation } from '/src/services/accessGroups/updateAccessGroups'
import { toast } from 'react-toastify'

const NewAccessGroup = ({ onClose, accessGroupList }) => {
  const [accessGroupName, setAccessGroupName] = useState('')
  const [createAccessGroup] = useCreateAccessGroupMutation()

  const accessGroupNames = useMemo(
    () => accessGroupList.map((i) => i?.name.toLowerCase()),
    [accessGroupList],
  )

  const onSubmit = async () => {
    try {
      await createAccessGroup({ name: accessGroupName }).unwrap()

      onClose(accessGroupName)
    } catch (error) {
      console.error(error)

      toast.error('Unable to create access group')
    }
  }

  let error = null
  if (accessGroupNames.includes(accessGroupName.toLowerCase()))
    error = 'This access group already exists'
  else if (!accessGroupName.match('^[a-zA-Z_]{2,20}$')) error = 'Invalid access group name'

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
          label="Create access group"
          icon="group_add"
          active={!error && accessGroupName}
          onClick={onSubmit}
        />
      </div>
    ),
    [error, accessGroupName, onSubmit],
  )

  return (
    <Dialog
      header="New access group"
      footer={footer}
      onClose={onClose}
      isOpen={true}
      style={{ width: 400, overflow: 'hidden' }}
      size="sm"
    >
      <FormLayout>
        <FormRow label="Access group name">
          <InputText
            value={accessGroupName}
            onChange={(e) => setAccessGroupName(e.target.value)}
            autoFocus
          />
        </FormRow>
        <FormRow>
          {error && !!accessGroupName && <span className="form-error-text">{error}</span>}
        </FormRow>
      </FormLayout>
    </Dialog>
  )
}

export default NewAccessGroup
