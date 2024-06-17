import { Button } from '@ynput/ayon-react-components'
import { useNotifications } from '@context/notificationsContext'
import { useUpdateUserPreferencesMutation } from '@queries/user/updateUser'
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

  const disabled = window.location.protocol !== 'https' && window.location.hostname !== 'localhost' // disable if not on HTTPS or localhost
  const tooltip = disabled
    ? 'Browser notifications only work over HTTPS'
    : 'Get notifications on your device'

  return (
    Notification.permission !== 'granted' && (
      <Button
        icon={'notifications'}
        data-tooltip={tooltip}
        onClick={handleEnable}
        variant="filled"
        disabled={disabled}
      >
        Enable notifications
      </Button>
    )
  )
}

export default EnableNotifications
