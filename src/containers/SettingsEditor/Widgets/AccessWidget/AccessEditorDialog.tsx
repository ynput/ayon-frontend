import styled from 'styled-components'

import { useState, useMemo } from 'react'
import { Button, Dialog } from '@ynput/ayon-react-components'
import { useGetShareOptionsQuery } from '@shared/api/queries/share/share'
import { ShareOption as ShareOptionType } from '@shared/api/generated/access'

const ShareOption = styled.div`
  background: #434a56;
  border-radius: 4px;
  padding: 8px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`

const ShareOptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
`

// Default share options that are always available
export const DEFAULT_SHARE_OPTIONS: ShareOptionType[] = [
  { label: 'Internal users', value: '__everyone__', shareType: 'global', name: 'Everyone' },
  { label: 'Guest users', value: '__guests__', shareType: 'global', name: 'Guests' },
]

export type AccessValues = Record<string, number | undefined>

interface AccessEditorDialogProps {
  initialValue: AccessValues
  onSubmit: (value: AccessValues | null) => void
  projectName: string
}

const AccessEditorDialog = ({ initialValue, onSubmit, projectName }: AccessEditorDialogProps) => {
  const [values, setValues] = useState<AccessValues>(initialValue || {})

  const { data: apiShareOptions = [] } = useGetShareOptionsQuery({
    projectName,
  })

  const shareOptions = useMemo(() => {
    return [...DEFAULT_SHARE_OPTIONS, ...apiShareOptions]
  }, [apiShareOptions])

  const footer = (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexDirection: 'row' }}>
      <Button onClick={() => onSubmit(values)} label="Submit" />
      <Button onClick={() => onSubmit(null)} label="Cancel" />
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
        {shareOptions.map((option) => (
          <ShareOption key={option.value}>
            {option.label} ({option.shareType})
            <input
              type="checkbox"
              checked={(values[option.value] ?? 0) > 0}
              onChange={(e) => {
                const newValue = { ...values, [option.value]: e.target.checked ? 10 : undefined }
                console.log(newValue)
                setValues(newValue)
              }}
            />
          </ShareOption>
        ))}
      </ShareOptionsContainer>
    </Dialog>
  )
}

export default AccessEditorDialog
