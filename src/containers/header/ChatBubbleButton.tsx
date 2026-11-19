import { HeaderButton } from '@shared/components'
import { useFeedback, SupportBubble } from '@shared/components'
import clsx from 'clsx'

const ChatBubbleButton = () => {
  const { openSupport, messengerLoaded, unreadCount } = useFeedback()
  const hasUnreadMessages = unreadCount > 0

  if (!messengerLoaded) return null
  return (
    <HeaderButton
      style={{ padding: '7px 5.5px' }}
      onClick={() => openSupport(hasUnreadMessages ? 'Messages' : 'NewMessage')}
      variant="nav"
      className={clsx({ notification: hasUnreadMessages })}
    >
      <SupportBubble />
    </HeaderButton>
  )
}

export default ChatBubbleButton
