import { toast } from 'react-toastify'

const getNotificationPermission = async (onGranted) => {
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
        onGranted && onGranted()
      } else {
        toast.warn('You just denied notifications. Did you mean to do that?')
      }
    } catch (error) {
      console.error(error)
      toast.error('Unable to get notification permission: ' + error.details)
    }
  } else {
    toast.warn('Notifications are blocked for this website. Unblock them in your browser settings.')
  }
}

const sendNotification = ({ title, body, options = {}, link }, callback) => {
  if (!('Notification' in window)) return
  if (Notification.permission === 'granted') {
    const icon = '/favicon-32x32.png'
    const notification = new Notification(title, { icon, body, ...options })
    notification.onclick = () => {
      window.focus()
      notification.close()
      if (link) window.location.pathname = link

      callback && callback()
    }
  } else {
    getNotificationPermission(() =>
      sendNotification({
        title: 'Hi from AYON! 👋',
        body: 'Disable notifications in account settings.',
        link: '/account/profile',
      }),
    )
  }
}

export default sendNotification
