// The header of a details panel (Settings > Users, Teams): its title, actions and close button.
import { useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Button } from '@ynput/ayon-react-components'
import { DialogStyled, HeaderStyled } from './DetailHeader.styled'

export interface DetailHeaderProps {
  children?: ReactNode
  onClose?: () => void
  style?: CSSProperties
  /** shown as JSON from a "more" button, when there are no rightActions */
  context?: unknown
  dialogTitle?: string
  rightActions?: ReactNode
}

export const DetailHeader = ({
  children,
  onClose,
  style,
  context,
  dialogTitle = '',
  rightActions,
}: DetailHeaderProps) => {
  const [showContext, setShowContext] = useState(false)

  return (
    <HeaderStyled style={style}>
      <div style={{ overflow: 'hidden' }}>{children}</div>
      {rightActions}
      {!!context && !rightActions && (
        <Button
          icon="more_vert"
          variant="text"
          onClick={() => setShowContext(!showContext)}
          data-tooltip="Full context data"
        />
      )}
      {onClose && <Button icon="close" variant="text" onClick={onClose} />}
      <DialogStyled
        header={dialogTitle}
        isOpen={showContext}
        onClose={() => setShowContext(false)}
        size="full"
      >
        <pre>{JSON.stringify(context, null, 2)}</pre>
      </DialogStyled>
    </HeaderStyled>
  )
}

export default DetailHeader
