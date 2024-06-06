import { Button } from '@ynput/ayon-react-components'
import sendNotification from '../helpers/browserNotification'
import { useNavigate } from 'react-router'

const EnableNotifications = () => {
  const navigate = useNavigate()

  return (
    Notification.permission !== 'granted' && (
      <Button
        icon={'notifications'}
        data-tooltip="Get notifications on your device"
        onClick={() =>
          sendNotification({ title: 'Notifications already enabled 💪' }, () =>
            navigate('/account/profile'),
          )
        }
        variant="filled"
      >
        Enable notifications
      </Button>
    )
  )
}

export default EnableNotifications
