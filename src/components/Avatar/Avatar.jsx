import React from 'react'
import { UserImage } from '@ynput/ayon-react-components'
import * as Styled from './Avatar.styled'

const Avatar = ({ user }) => {
  return (
    <Styled.Avatar>
        <Styled.AvatarIcon onClick={() => console.log('test')} icon='edit' />
        <UserImage  {...user} size={150} src={user?.attrib?.avatarUrl} />
    </Styled.Avatar>
  )
}

export default Avatar