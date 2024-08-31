import { FormLayout, FormRow, InputText, SaveButton, Dialog } from '@ynput/ayon-react-components'
import { useMemo, useState } from 'react'
import { useSaveAccessGroupMutation } from '@queries/accessGroups/updateAccessGroups'
import { toast } from 'react-toastify'

const NewAccessGroup = ({ onClose, accessGroupList }) => {
  const [accessGroupName, setAccessGroupName] = useState('')
  const [createAccessGroup] = useSaveAccessGroupMutation()

  const accessGroupNames = useMemo(
    () => accessGroupList.map((i) => i?.name.toLowerCase()),
    [accessGroupList],
  )

  const onSubmit = async (close) => {
    try {
      await createAccessGroup({ accessGroupName, projectName: '_', data: {} }).unwrap()

      close && onClose(accessGroupName)
    } catch (error) {
      console.error(error)

      toast.error('Unable to create access group')
    }
  }

  let error = null
  if (accessGroupNames.includes(accessGroupName.toLowerCase()))
    error = 'This access group already exists'
  else if (!accessGroupName.match('^[a-zA-Z_]{2,20}$')) error = 'Invalid access group name'

  const handleKeyDown = (e) => {
    e?.stopPropagation()
    const isEnter = e.key === 'Enter'
    const isEsc = e.key === 'Escape'
    const isCtrlMeta = e.ctrlKey || e.metaKey
    const isShift = e.shiftKey
    if (isCtrlMeta && isEnter && !error) onSubmit(true)
    if (isShift && isEnter && !error) onSubmit(false)
    if (isEsc) onClose()
  }

  const footer = useMemo(
    () => (
      <div>
        <SaveButton
          label="Create access group"
          icon="group_add"
          active={!error && accessGroupName}
          onClick={() => onSubmit(true)}
        />
      </div>
    ),
    [error, accessGroupName, onSubmit],
  )

  return (
    <Dialog
      header="New access group"
      footer={footer}
      onClose={() => onClose()}
      isOpen
      onKeyDown={handleKeyDown}
      size="md"
      style={{ width: 400 }}
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
