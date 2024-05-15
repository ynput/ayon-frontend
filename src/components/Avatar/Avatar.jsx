import { useRef } from 'react'
import UserImage from '/src/components/UserImage'
import * as Styled from './Avatar.styled'

const Avatar = ({ user, onUpdateAvatar }) => {

  
  const fileInput = useRef(null)

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
        <Styled.ImageIcon>
          <Styled.AvatarIcon onClick={() => fileInput.current.click()} icon='edit' />
          <UserImage size={100} name={user.name}/>
        </Styled.ImageIcon>
        <Styled.Username>
          {user?.attrib?.fullName}
        </Styled.Username>
    </Styled.Avatar>
  )
}

export default Avatar