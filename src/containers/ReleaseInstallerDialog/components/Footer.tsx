import { forwardRef } from 'react'
import { Footer as FooterStyled } from '../ReleaseInstaller.styled'
import { Button, SaveButton, SaveButtonProps } from '@ynput/ayon-react-components'

interface FooterProps extends React.HTMLAttributes<HTMLElement> {
  isFinal?: boolean
  saveButton?: SaveButtonProps
  onCancel: () => void
  onConfirm: () => void
}

export const Footer = forwardRef<HTMLElement, FooterProps>(
  ({ onCancel, onConfirm, isFinal, saveButton, ...props }, ref) => {
    return (
      <FooterStyled {...props} ref={ref}>
        <Button variant="text" onClick={onCancel}>
          Cancel
        </Button>
        {isFinal ? (
          <SaveButton onClick={onConfirm} {...saveButton}>
            Confirm
          </SaveButton>
        ) : (
          <Button onClick={onConfirm}>Confirm</Button>
        )}
      </FooterStyled>
    )
  },
)
