import React from 'react'
import { Menu } from '@shared/components'
import { useFeedback } from '@shared/components'

export const HelpMenu = ({ user, ...props }) => {
  const { openSupport, openFeedback, openPortal, loaded } = useFeedback()

  const help = [
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
  ]

  if (loaded) help.unshift(...[...feedback, { id: 'divider' }])

  const items = user.uiExposureLevel >= 500 ? help : feedback

  return <Menu menu={items} {...props} />
}

export default HelpMenu
