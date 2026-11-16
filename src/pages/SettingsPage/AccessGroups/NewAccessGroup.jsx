import { FormLayout, FormRow, InputText, SaveButton, Dialog } from '@ynput/ayon-react-components'
import { useMemo, useRef, useState } from 'react'
import { useGetAccessGroupQuery, useSaveAccessGroupMutation } from '@shared/api'
import { toast } from 'react-toastify'
import { getCreateAnotherTooltip, getDialogKeyDown } from '@shared/util'
import { getDuplicateAccessGroupName } from './NewAccessGroupHelpers'

// sourceAccessGroup: name of a studio access group to copy the permissions from (duplicate mode)
const NewAccessGroup = ({ onClose, accessGroupList, sourceAccessGroup }) => {
  const isDuplicate = !!sourceAccessGroup

  const accessGroupNames = useMemo(
    () => accessGroupList.map((i) => i?.name.toLowerCase()),
    [accessGroupList],
  )

  const [accessGroupName, setAccessGroupName] = useState(() =>
    isDuplicate ? getDuplicateAccessGroupName(sourceAccessGroup, accessGroupNames) : '',
  )
  const [createAccessGroup, { isLoading }] = useSaveAccessGroupMutation()
  const inputRef = useRef(null)

  // the studio level permissions of the group being duplicated
  const {
    data: sourcePermissions,
    isFetching: isLoadingSource,
    isError: isSourceError,
  } = useGetAccessGroupQuery(
    { accessGroupName: sourceAccessGroup, projectName: '_' },
    { skip: !isDuplicate, refetchOnMountOrArgChange: true },
  )

  // close = false (Shift+Enter): create it and keep the dialog open for the next one
  const onSubmit = async (close) => {
    try {
      await createAccessGroup({
        accessGroupName,
        projectName: '_',
        permissions: isDuplicate ? sourcePermissions : {},
      }).unwrap()

      if (close) return onClose(accessGroupName)
      toast.success(`Access group "${accessGroupName}" created`)
      setAccessGroupName('')
      inputRef.current?.focus()
    } catch {
      toast.error(
        isDuplicate ? 'Unable to duplicate access group' : 'Unable to create access group',
      )
    }
  }

  let error = null
  if (accessGroupNames.includes(accessGroupName.toLowerCase()))
    error = 'This access group already exists'
  else if (!accessGroupName.match('^[a-zA-Z0-9_]([a-zA-Z0-9_.\\-]*[a-zA-Z0-9_])?$'))
    error = 'Invalid access group name'
  else if (isSourceError) error = `Unable to load access group "${sourceAccessGroup}"`

  const sourceNotReady = isDuplicate && (isLoadingSource || !sourcePermissions)
  const disabled = !!error || isLoading || sourceNotReady

  const dialogKeyDown = getDialogKeyDown(() => onSubmit(true), {
    onClose: () => onClose(),
    disabled,
    // duplicating is a one-off, so Shift+Enter "create another" only applies to new groups
    onContinue: isDuplicate ? undefined : () => onSubmit(false),
  })
  const handleKeyDown = (e) => {
    e.stopPropagation()
    dialogKeyDown(e)
  }

  const footer = useMemo(
    () => (
      <div>
        <SaveButton
          label={isDuplicate ? 'Duplicate access group' : 'Create access group'}
          icon={isDuplicate ? 'content_copy' : 'group_add'}
          active={!disabled && accessGroupName}
          saving={isLoading}
          onClick={() => onSubmit(true)}
          {...(isDuplicate ? {} : getCreateAnotherTooltip())}
        />
      </div>
    ),
    [disabled, accessGroupName, isDuplicate, isLoading, onSubmit],
  )

  return (
    <Dialog
      header={isDuplicate ? `Duplicate access group "${sourceAccessGroup}"` : 'New access group'}
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
            onFocus={(e) => isDuplicate && e.target.select()}
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
