import { UserImage as UserImageArc } from '@ynput/ayon-react-components'

// wraps the ARC UserImage component to use new user image api
const UserImage = ({ name, ...props }) => {
  return <UserImageArc src={`/api/users/${name}/avatar`} {...props} />
}

export default UserImage
