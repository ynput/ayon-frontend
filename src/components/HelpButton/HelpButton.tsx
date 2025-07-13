import React from 'react'
import { Button } from '@ynput/ayon-react-components'
import styled from 'styled-components'

import { useFeedback } from '@shared/components'

const StyledHelpButton = styled(Button)`
  margin-left: auto;
  flex-shrink: 0;
`

interface HelpButtonProps {
  className?: string
  pageTitle?: string
  helpArticleId?: string
}

const HelpButton: React.FC<HelpButtonProps> = ({ className, pageTitle, helpArticleId }) => {
  const { openSupport, openPortal, messengerVisibility, setMessengerVisibility } = useFeedback()

  const ensureOnlyOneDialogOpen = () => {
    if (helpArticleId && messengerVisibility) {
      const win = window as any
      if (typeof win.Featurebase === 'function') {
        win.Featurebase('hide')
        setMessengerVisibility(false)
      }
    }
  }

  const handleHelpClick = () => {
    ensureOnlyOneDialogOpen()

    setTimeout(() => {
      if (helpArticleId) {
        openPortal('HelpView', helpArticleId)
      } else {
        if (pageTitle) {
          const message = `Can you help me know more about the ${pageTitle} page?`
          openSupport('NewMessage', message)
        } else {
          openSupport('Help')
        }
      }
    }, 100)
  }

  return (
    <StyledHelpButton
      icon="help"
      variant="text"
      onClick={handleHelpClick}
      className={className}
      data-tooltip="Get help for this page"
    />
  )
}

export default HelpButton
