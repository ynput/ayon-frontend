import React from 'react'
import Menu from '../MenuComponents/Menu'
import { useFeedback } from '@shared/components'

export const HelpMenu = ({ user, ...props }) => {
  const isUser = user.data.isUser
  const { openSupport, openFeedback, openPortal, loaded } = useFeedback()

  const items = [
    {
      id: 'forum',
      label: 'Community Forum',
      link: 'https://community.ynput.io/',
      icon: 'forum',
      target: '_blank',
    },
    {
      id: 'discord',
      label: 'Discord Server',
      link: 'https://discord.gg/ynput',
      img: '/Discord-Symbol-White.svg',
      target: '_blank',
    },
    { id: 'divider' },
    {
      id: 'documentation',
      label: 'Dev Portal',
      link: 'https://docs.ayon.dev/',
      icon: 'code',
      target: '_blank',
    },
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
      onClick: () => openPortal('MainView'),
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

  return <Menu menu={items} {...props} />
}

export default HelpMenu
