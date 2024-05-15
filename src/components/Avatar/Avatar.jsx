import { useRef } from 'react'
import { UserImage } from '@ynput/ayon-react-components'
import * as Styled from './Avatar.styled'

const Avatar = ({ user, onUpdateAvatar }) => {

  
  const fileInput = useRef(null)

  console.log(fileInput,'fileInput')

  const handleInputChange = (e) => {
    e.preventDefault()
    if (!e.target.files || !e.target.files[0]) return
    const files = e.target.files[0]
    console.log(files, 'files')
    onUpdateAvatar(files)
  }

  return (
    <Styled.Avatar>

        <input type="file" ref={fileInput} style={{ display: 'none' }}  multiple={false} onChange={handleInputChange} accept=".png, .jpeg, .jpg" />
        <Styled.AvatarIcon onClick={() => fileInput.current.click()} icon='edit' />
        
        <UserImage  {...user} size={100} src={user?.attrib?.avatarUrl} />
    </Styled.Avatar>
  )
}

export default Avatar