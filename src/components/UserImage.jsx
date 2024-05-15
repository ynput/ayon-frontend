import { UserImage as UserImageArc } from '@ynput/ayon-react-components'

// wraps the ARC UserImage component to use new user image api
const UserImage = ({ name, imageKey, ...props }) => {
  return <UserImageArc name={name} src={name && `/api/users/${name}/avatar${imageKey || ''}`} {...props} />
}

export default UserImage
