import { useNavigate } from 'react-router'
import getNotificationPermission from '../helpers/getNotificationPermission'

const useNotification = () => {
  const navigate = useNavigate()

  const sendNotification = (title, body, link, options = {}) => {
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
      getNotificationPermission(() =>
        sendNotification(
          'Hi from AYON! 👋',
          'Disable notifications in account settings.',
          '/account/profile',
        ),
      )
    }
  }
  return sendNotification
}

export default useNotification
