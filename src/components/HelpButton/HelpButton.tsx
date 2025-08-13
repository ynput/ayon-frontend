import React from 'react'
import { Button } from '@ynput/ayon-react-components'
import { useFeedback } from '@shared/components'
import { getHelpForPage } from '@helpers/helpArticles'

interface HelpButtonProps {
    module: string
    pageName?: string
    className?: string
}

const HelpButton: React.FC<HelpButtonProps> = ({ module, pageName, className }) => {
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
        <Button
            icon="help"
            variant="text"
            onClick={handleHelpClick}
            className={className}
            data-tooltip="Get help for this page"
        />
    )
}

export default HelpButton
