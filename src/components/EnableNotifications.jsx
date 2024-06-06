import { Button } from '@ynput/ayon-react-components'
import { useNotifications } from '../context/notificationsContext'
import { useUpdateUserPreferencesMutation } from '../services/user/updateUser'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'

const EnableNotifications = () => {
  const user = useSelector((state) => state.user)
  const { sendNotification } = useNotifications()

  // update user preferences to enable notifications
  const [updatePreferences] = useUpdateUserPreferencesMutation()

  const handleEnable = async () => {
    sendNotification({ title: 'Notifications already enabled 💪', link: '/account/profile' })

    try {
      await updatePreferences({
        name: user.name,
        preferences: { notifications: true },
      }).unwrap()
    } catch (error) {
      toast.error('Unable to enable notifications. Try again in account/profile.')
    }
  }

  return (
    Notification.permission !== 'granted' && (
      <Button
        icon={'notifications'}
        data-tooltip="Get notifications on your device"
        onClick={handleEnable}
        variant="filled"
      >
        Enable notifications
      </Button>
    )
  )
}

export default EnableNotifications
