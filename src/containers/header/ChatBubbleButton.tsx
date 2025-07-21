import { FC } from 'react'
import HeaderButton from './HeaderButton'
import { useFeedback, SupportBubble } from '@shared/components'
import clsx from 'clsx'

interface ChatBubbleButtonProps {}

const ChatBubbleButton: FC<ChatBubbleButtonProps> = ({}) => {
  const { openSupport, messengerLoaded, unreadCount } = useFeedback()
  const hasUnreadMessages = unreadCount > 0

  if (!messengerLoaded) return null
  return (
    <HeaderButton
      style={{ padding: '8px 6px' }}
      onClick={() => openSupport(hasUnreadMessages ? 'Messages' : 'NewMessage')}
      variant="nav"
      className={clsx({ notification: hasUnreadMessages })}
    >
      <SupportBubble />
    </HeaderButton>
  )
}

export default ChatBubbleButton
