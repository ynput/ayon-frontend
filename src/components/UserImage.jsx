import { UserImage as UserImageArc } from '@ynput/ayon-react-components'

// wraps the ARC UserImage component to use new user image api
const UserImage = ({ name, ...props }) => {
  return <UserImageArc name={name} src={name && `/api/users/${name}/avatar`} {...props} />
}

export default UserImage
