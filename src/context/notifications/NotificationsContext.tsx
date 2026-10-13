import { useRef } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import RemoveMarkdown from 'remove-markdown'
import usePubSub from '@hooks/usePubSub'
import { Icon } from '@ynput/ayon-react-components'
import { useAppSelector } from '@state/store'
import { NotificationsContext } from './NotificationsContextInstance'
import type { SendNotificationOptions } from './NotificationsContextInstance'

type InboxNotificationMessage = {
  summary?: { isImportant?: boolean }
  description: string
}

function NotificationsProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const {
    data: { frontendPreferences: { notifications = false, notificationSound = false } = {} } = {},
  } = useAppSelector((state) => state.user) || {}

  const getNotificationPermission = async () => {
    if (!('Notification' in window)) {
      // Check if the browser supports notifications
      alert('This browser does not support desktop notification')
      return false
    } else if (Notification.permission === 'granted') {
      // Check whether notification permissions have already been granted;
      // if so, create a notification
      new Notification('Notifications already enabled 💪', { icon: `/favicon-32x32.png` })
      return true
    } else if (Notification.permission !== 'denied') {
      try {
        const permission = await Notification.requestPermission()
        if (permission === 'granted') {
          return true
        } else {
          toast.warn('You just denied notifications. Did you mean to do that?')
          return false
        }
      } catch (error) {
        console.error(error)
        toast.error(
          'Unable to get notification permission: ' + (error as { details?: string }).details,
        )
        return false
      }
    } else {
      toast.warn(
        'Notifications are blocked for this website. Unblock them in your browser settings.',
      )
      return false
    }
  }

  const sendNotification = async ({ title, body, options = {}, link }: SendNotificationOptions) => {
    if (!('Notification' in window)) return
    if (Notification.permission === 'granted') {
      const icon = '/favicon-32x32.png'
      const notification = new Notification(title, { icon, body, ...options })
      notification.onclick = () => {
        window.focus()
        notification.close()
        if (link) navigate(link)
      }
    } else {
      const granted = await getNotificationPermission()

      if (granted) {
        sendNotification({
          title: 'Hi from AYON! 👋',
          body: 'Disable notifications in account settings.',
          link: '/account/profile',
        })
      }

      return granted
    }
  }

  const soundRef = useRef<HTMLAudioElement | null>(null)
  const toastId = useRef<ReturnType<typeof toast.info> | null>(null)

  //   subscribe to inbox.message topic
  usePubSub(
    'inbox.message',
    (_topic: string, message: InboxNotificationMessage) => {
      // only show notifications for important messages
      if (!message.summary?.isImportant) return

      console.log('IMPORTANT MESSAGE:', message)

      if (notificationSound && !document.hasFocus()) {
        // play a notification sound
        soundRef.current?.play()
      }

      // user has disabled notifications
      if (!notifications) return

      // remove markdown from the message description
      const body = RemoveMarkdown(message?.description)
      const title = 'New AYON message'

      // check if window is already focused
      // show a toast instead of a desktop notification
      if (document.hasFocus()) {
        const toastConfig = {
          onClick: () => navigate('/inbox/important'),
          icon: <Icon icon={'mark_email_unread'} />,
        }

        if (toastId.current === null || !toast.isActive(toastId.current)) {
          toastId.current = toast.info(body, toastConfig)
        } else {
          // update the toast message instead
          toast.update(toastId.current, toastConfig)
        }
      } else {
        // check if the user has granted permission to send notifications
        if (Notification.permission !== 'granted') return

        // send a desktop notification to the user
        sendNotification({
          title: title,
          body: body,
          link: '/inbox/important',
        })
      }
    },
    null,
    { deps: [notifications, notificationSound, soundRef.current] },
  )

  return (
    <NotificationsContext.Provider value={{ sendNotification }}>
      {notificationSound && <audio src="/ayon-notification.mp3" ref={soundRef} />}
      {children}
    </NotificationsContext.Provider>
  )
}

export { NotificationsProvider }
