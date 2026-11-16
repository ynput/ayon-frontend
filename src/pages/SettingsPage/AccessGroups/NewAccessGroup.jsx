import { FormLayout, FormRow, InputText, SaveButton, Dialog } from '@ynput/ayon-react-components'
import { useMemo, useRef, useState } from 'react'
import { useSaveAccessGroupMutation } from '@shared/api'
import { toast } from 'react-toastify'
import { getCreateAnotherTooltip, getDialogKeyDown } from '@shared/util'

const NewAccessGroup = ({ onClose, accessGroupList }) => {
  const [accessGroupName, setAccessGroupName] = useState('')
  const [createAccessGroup, { isLoading }] = useSaveAccessGroupMutation()
  const inputRef = useRef(null)

  const accessGroupNames = useMemo(
    () => accessGroupList.map((i) => i?.name.toLowerCase()),
    [accessGroupList],
  )

  // close = false (Shift+Enter): create it and keep the dialog open for the next one
  const onSubmit = async (close) => {
    try {
      await createAccessGroup({ accessGroupName, projectName: '_', permissions: {} }).unwrap()

      if (close) return onClose(accessGroupName)
      toast.success(`Access group "${accessGroupName}" created`)
      setAccessGroupName('')
      inputRef.current?.focus()
    } catch (error) {
      toast.error('Unable to create access group')
    }
  }

  let error = null
  if (accessGroupNames.includes(accessGroupName.toLowerCase()))
    error = 'This access group already exists'
  else if (!accessGroupName.match('^[a-zA-Z0-9_]([a-zA-Z0-9_.\\-]*[a-zA-Z0-9_])?$'))
    error = 'Invalid access group name'
  const dialogKeyDown = getDialogKeyDown(() => onSubmit(true), {
    onClose: () => onClose(),
    disabled: !!error || isLoading,
    onContinue: () => onSubmit(false),
  })
  const handleKeyDown = (e) => {
    e.stopPropagation()
    dialogKeyDown(e)
  }

  const footer = useMemo(
    () => (
      <div>
        <SaveButton
          label="Create access group"
          icon="group_add"
          active={!error && accessGroupName}
          onClick={() => onSubmit(true)}
          {...getCreateAnotherTooltip()}
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
            ref={inputRef}
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
