import { Button } from '@ynput/ayon-react-components'
import useNotification from '../hooks/useNotification'

const EnableNotifications = () => {
  const sendFirstNotification = useNotification()

  return (
    Notification.permission !== 'granted' && (
      <Button
        icon={'notifications'}
        data-tooltip="Get notifications on your device"
        onClick={() => sendFirstNotification('Notifications already enabled 💪')}
        variant="filled"
      >
        Enable notifications
      </Button>
    )
  )
}

export default EnableNotifications
