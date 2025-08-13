import React from 'react'
import { Button } from '@ynput/ayon-react-components'
import { useFeedback } from '@shared/components'
import { getHelpForPage } from '@helpers/helpArticles'
import styled from 'styled-components'

interface StickyHelpButtonProps {
    module: string
    pageName?: string
}

const StickyContainer = styled.div`
  position: fixed;
  right: 16px;
  bottom: 24px;
  z-index: 500;
  
  button {
    background-color: var(--md-sys-color-surface-container-high);
    color: var(--md-sys-color-on-surface);
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: 50%;
    width: 40px;
    height: 40px;
    padding: 0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
    opacity: 0.7;

    &:hover {
      opacity: 1;
      background-color: var(--md-sys-color-surface-container-highest);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    }

    span {
      font-size: 16px;
    }
  }
`

const StickyHelpButton: React.FC<StickyHelpButtonProps> = ({ module, pageName }) => {
    const { openSupport } = useFeedback()

    const handleHelpClick = () => {
        const help = getHelpForPage(module, pageName)

        if (help.articleId) {
            // Open specific help article
            openSupport('ShowArticle', help.articleId)
        } else {
            // Open support with a prefilled message
            openSupport('NewMessage', help.fallbackMessage)
        }
    }

    return (
        <StickyContainer>
            <Button
                icon="help"
                variant="text"
                onClick={handleHelpClick}
                data-tooltip="Get help for this page"
            />
        </StickyContainer>
    )
}

export default StickyHelpButton
