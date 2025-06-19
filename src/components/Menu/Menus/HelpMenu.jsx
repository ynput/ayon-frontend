import React from 'react'
import Menu from '../MenuComponents/Menu'
import { useFeedback } from '@/feedback/FeedbackContext'

export const HelpMenu = ({ user, ...props }) => {
  const isUser = user.data.isUser
  const { openSupport, openFeedback, loaded } = useFeedback()

  const items = [
    {
      id: 'documentation',
      label: 'Documentation',
      link: 'https://ayon.ynput.io/',
      icon: 'description',
      target: '_blank',
    },
    {
      id: 'forum',
      label: 'Community Forum',
      link: 'https://community.ynput.io/',
      icon: 'forum',
      target: '_blank',
    },
    { id: 'divider' },
    {
      id: 'api',
      label: 'REST API',
      link: '/doc/api',
      icon: 'api',
      target: '_blank',
    },
    {
      id: 'graphql',
      label: 'GraphQL Explorer',
      link: '/explorer',
      icon: 'hub',
      target: '_blank',
    },
  ]

  const feedback = [
    {
      id: 'help',
      label: 'Help center',
      icon: 'help',
      onClick: () => openSupport('Home'),
    },
    {
      id: 'changelog',
      label: 'Latest changes',
      icon: 'track_changes',
      onClick: () => openSupport('Changelog'),
    },
    {
      id: 'feedback',
      label: 'Submit Feedback',
      icon: 'feedback',
      onClick: () => openFeedback(),
    },
    { id: 'divider' },
  ]

  if (loaded) items.unshift(...feedback)

  const managers = [
    {
      id: 'divider',
    },
    {
      id: 'support',
      label: 'Get Support',
      link: 'https://ynput.io/services',
      icon: 'support_agent',
      target: '_blank',
    },
  ]

  if (!isUser) items.push(...managers)

  return <Menu menu={items} {...props} />
}

export default HelpMenu
