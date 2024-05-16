import { UserImage as UserImageArc, getShimmerStyles } from '@ynput/ayon-react-components'
import styled from 'styled-components'

const UserImageArcPlaceholder = styled(UserImageArc)`
    background: transparent;
    border-radius: medium;
    ${getShimmerStyles()}
    > span {
      display: none;
    }
`
// wraps the ARC UserImage component to use new user image api
const UserImage = ({ name, imageKey, ...props }) => {
  if (!name) return  <UserImageArcPlaceholder {...props} />
  return <UserImageArc name={name} src={`/api/users/${name}/avatar${imageKey || ''}`} {...props} />
}

export default UserImage
