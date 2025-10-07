import styled from 'styled-components'

import { useState, useMemo } from 'react'
import { Button, Dialog } from '@ynput/ayon-react-components'
import { useGetShareOptionsQuery } from '@shared/api/queries/share/share'
import { ShareOption as ShareOptionType } from '@shared/api/generated/access'
import { AccessSearchInput } from '@shared/components/AccessSearchInput'
import { AccessUser } from '@shared/components/AccessUser/AccessUser'
import {
  EVERY_GUESTS_KEY,
  EVERYONE_GROUP_KEY,
} from '@shared/components/ShareOptionIcon/ShareOptionIcon'

const ShareOptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-large);
  overflow-y: auto;
  flex: 1;
`

const AccessList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-small);
  overflow-y: auto;
`

// Default share options that are always available
export const DEFAULT_SHARE_OPTIONS: ShareOptionType[] = [
  {
    label: 'Everyone (internal)',
    value: EVERYONE_GROUP_KEY,
    shareType: 'global',
    name: EVERYONE_GROUP_KEY,
  },
  { label: 'All Guests', value: EVERY_GUESTS_KEY, shareType: 'global', name: EVERY_GUESTS_KEY },
]

const DEFAULT_ACCESS_LEVEL = 10 // Default access level when adding a new user/group

export type AccessValues = Record<string, number | undefined>

interface AccessEditorDialogProps {
  initialValue: AccessValues
  onSubmit: (value: AccessValues | null) => void
  projectName: string
}

const AccessEditorDialog = ({ initialValue, onSubmit, projectName }: AccessEditorDialogProps) => {
  const [values, setValues] = useState<AccessValues>(initialValue || {})

  const { data: apiShareOptions = [] } = useGetShareOptionsQuery({
    projectName: projectName || undefined,
  })

  const shareOptions = useMemo(() => {
    return [...DEFAULT_SHARE_OPTIONS, ...apiShareOptions]
  }, [apiShareOptions])

  // Get only the users/groups that have access (access level >= DEFAULT_ACCESS_LEVEL)
  const usersWithAccess = useMemo(() => {
    return shareOptions.filter((option) => (values[option.value] ?? 0) >= DEFAULT_ACCESS_LEVEL)
  }, [shareOptions, values])

  // Get existing access list (keys with values >= DEFAULT_ACCESS_LEVEL)
  const existingAccess = useMemo(() => {
    return Object.keys(values).filter((key) => (values[key] ?? 0) >= DEFAULT_ACCESS_LEVEL)
  }, [values])

  // Handle adding a new user/group
  const handleAddAccess = (option: ShareOptionType) => {
    setValues({ ...values, [option.value]: DEFAULT_ACCESS_LEVEL })
  }

  // Handle removing access
  const handleRemoveAccess = (value: string) => {
    const newValues = { ...values }
    delete newValues[value]
    setValues(newValues)
  }

  const footer = (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexDirection: 'row' }}>
      <Button onClick={() => onSubmit(null)} label="Cancel" variant="text" />
      <Button onClick={() => onSubmit(values)} label="Submit" />
    </div>
  )

  return (
    <Dialog
      header="Edit Access"
      footer={footer}
      isOpen
      size="lg"
      onClose={() => onSubmit(null)}
      style={{ width: '600px', height: '600px' }}
    >
      <ShareOptionsContainer>
        <AccessSearchInput
          shareOptions={shareOptions}
          existingAccess={existingAccess}
          owner={null}
          placeholder="Add people or access groups"
          onSelectOption={handleAddAccess}
          pt={{ list: { style: { maxHeight: 400 } } }}
        />

        <AccessList>
          {usersWithAccess.map((option) => (
            <AccessUser
              key={option.value}
              name={option.name}
              label={option.label}
              shareType={option.shareType}
              isOwner={false}
              isMe={false}
            >
              <Button
                icon="close"
                variant="text"
                className="remove"
                onClick={() => handleRemoveAccess(option.value)}
              />
            </AccessUser>
          ))}
          {usersWithAccess.length === 0 && (
            <div
              style={{
                color: 'var(--md-sys-color-outline)',
                padding: 'var(--padding-m)',
                textAlign: 'center',
              }}
            >
              No users or groups have access. Use the search above to add access.
            </div>
          )}
        </AccessList>
      </ShareOptionsContainer>
    </Dialog>
  )
}

export default AccessEditorDialog
