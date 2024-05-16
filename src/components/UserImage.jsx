import { UserImage as UserImageArc, getShimmerStyles } from '@ynput/ayon-react-components'
import styled, { css } from 'styled-components'

const UserImageArcPlaceholder = styled(UserImageArc)`
     position: relative;
     > span {
      display: none;
     }
     ${({ $name }) => $name &&
      css`
          color: transparent;
          border-radius: medium;
          ${getShimmerStyles()}
      `}
`
// wraps the ARC UserImage component to use new user image api
const UserImage = ({ name, imageKey, ...props }) => {
  if (name) return  <UserImageArcPlaceholder $name={name} {...props} />
  return <UserImageArc name={name} src={`/api/users/${name}/avatar${imageKey || ''}`} {...props} />
}

export default UserImage
