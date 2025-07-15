import React from 'react'
import { Button } from '@ynput/ayon-react-components'
import { useFeedback } from '@shared/components'

// Direct mapping of page modules to their article IDs (only for modules that have help articles)
const ARTICLE_NAME_TO_ID: Record<string, string> = {
  overview: '7885519', // Project Overview Page
  tasks: '5526719', // Task Progress Page
  browser: '2408349', // Tasks (Home) Page
  lists: '7382645', // Lists
  reviews: '0359490', // Reviewables
  scheduler: '8736562', // Planner Addon
  teams: '6300319', // TODO Teams

  // Inbox Pages
  inbox: '7870202', // TODO Inbox and Notifications

  // Features & Components
  powerpack: '7017685', // TODO Power Addon
  feed: '8709483', // TODO The Activity Feed
  details: '0219162', // TODO The Details Panel
  'review-sessions': '8669165', // TODO Review Sessions
}

// Default messages for pages without help articles
const DEFAULT_MESSAGES: Record<string, string> = {
  workfiles: 'Can you help me know more about the Workfiles page?',
}

interface ProjectHelpButtonProps {
  currentModule?: string
  projectName?: string
}

export const ProjectHelpButton: React.FC<ProjectHelpButtonProps> = ({
  currentModule,
  projectName,
}) => {
  const { openSupport } = useFeedback()

  const handleHelpClick = () => {
    if (!currentModule) {
      // Generic help for project pages
      openSupport('Help')
      return
    }

    // Check if we have a specific help article for this module
    const articleId = ARTICLE_NAME_TO_ID[currentModule]
    if (articleId) {
      // Open specific help article
      openSupport('ShowArticle', articleId)
    } else {
      // Open support with prefilled message
      const defaultMessage = DEFAULT_MESSAGES[currentModule]
      if (defaultMessage) {
        openSupport('NewMessage', defaultMessage)
      } else {
        // Generic fallback message
        const message = projectName
          ? `Can you help me know more about the ${currentModule} page in project "${projectName}"?`
          : `Can you help me know more about the ${currentModule} page?`
        openSupport('NewMessage', message)
      }
    }
  }

  return (
    <Button
      icon="help"
      variant="text"
      onClick={handleHelpClick}
      data-tooltip="Get help for this page"
      style={{
        minWidth: 'auto',
        padding: '8px',
      }}
    />
  )
}

export default ProjectHelpButton
