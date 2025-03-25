import { UserImage as UserImageArc } from '@ynput/ayon-react-components'
import clsx from 'clsx'

// wraps the ARC UserImage component to use new user image api
const UserImage = ({ name, fullName, imageKey, ...props }) => {
  if (!name) return <UserImageArc className={clsx(props.className, 'loading')} {...props} />
  return (
    <UserImageArc
      name={name}
      fullName={fullName}
      src={`/api/users/${name}/avatar?key=${imageKey || ''}`}
      {...props}
    />
  )
}

export default UserImage
