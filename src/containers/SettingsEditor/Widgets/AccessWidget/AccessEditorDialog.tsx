import styled from 'styled-components'

import { useState, useMemo } from 'react'
import { Button, Dialog } from '@ynput/ayon-react-components'
import { useGetShareOptionsQuery } from '@shared/api/queries/share/share'
import { ShareOption as ShareOptionType } from '@shared/api/generated/access'
import { AccessSearchInput } from '@shared/components/AccessSearchInput'
import { AccessLevel, AccessUser } from '@shared/components/AccessUser/AccessUser'
import {
  EVERY_GUESTS_KEY,
  EVERYONE_GROUP_KEY,
} from '@shared/components/ShareOptionIcon/ShareOptionIcon'
import { AccessLevelDropdown } from './AccessLevelDropdown'

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

export type AccessOption = {
  label: string
  value: number
  tooltip?: string
}

const VIEWER_ACCESS_LEVEL = 10 // Default access level when adding a new user/group

export const ACCESS_LEVEL_LABELS = {
  0: 'No access',
  10: 'Viewer',
  20: 'Editor',
  30: 'Admin',
}
// Create access options for dropdown
const defaultAccessOptions: AccessOption[] = [
  { label: ACCESS_LEVEL_LABELS[0], value: 0 },
  { label: ACCESS_LEVEL_LABELS[10], value: 10 },
  { label: ACCESS_LEVEL_LABELS[20], value: 20 },
  { label: ACCESS_LEVEL_LABELS[30], value: 30 },
]

export type AccessValues = Record<string, AccessLevel>

interface AccessEditorDialogProps {
  initialValue: AccessValues
  onSubmit: (value: AccessValues | null) => void
  projectName: string
  accessOptions?: AccessOption[]
}

const AccessEditorDialog = ({
  initialValue,
  onSubmit,
  projectName,
  accessOptions: accessOptionsProp,
}: AccessEditorDialogProps) => {
  const [values, setValues] = useState<AccessValues>(initialValue || {})

  const { data: apiShareOptions = [] } = useGetShareOptionsQuery({
    projectName: projectName || undefined,
  })

  const accessOptions = (accessOptionsProp || defaultAccessOptions).map((o) => ({
    ...o,
    value: String(o.value),
  }))

  const shareOptions = useMemo(() => {
    return [...DEFAULT_SHARE_OPTIONS, ...apiShareOptions]
  }, [apiShareOptions])

  // Only show users/groups that have at some level set
  const usersWithAccess = useMemo(() => {
    return shareOptions.filter((option) => typeof values[option.value] === 'number')
  }, [shareOptions, values])

  // Get existing access list (keys with values >= VIEWER_ACCESS_LEVEL)
  const existingAccess = useMemo(() => {
    return Object.keys(values).filter((key) => (values[key] ?? 0) >= VIEWER_ACCESS_LEVEL)
  }, [values])

  // Handle adding a new user/group
  const handleAddAccess = (option: ShareOptionType) => {
    setValues({ ...values, [option.value]: VIEWER_ACCESS_LEVEL })
  }

  // Handle changing access level
  const handleAccessLevelChange = (value: string, newLevel: AccessLevel) => {
    setValues({ ...values, [value]: newLevel })
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
          pt={{ list: { style: { maxHeight: 300 } } }}
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
              <AccessLevelDropdown
                accessLevel={values[option.value] || 0}
                accessOptions={accessOptions}
                onChange={(newLevel) => handleAccessLevelChange(option.value, newLevel)}
              />
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
