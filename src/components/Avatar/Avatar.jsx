import { useRef, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import UserImage from '@shared/UserImage'
import * as Styled from './Avatar.styled'

const Avatar = ({ user }) => {
  const fileInput = useRef(null)
  const [imageKey, setImageKey] = useState(null)

  const onUpdateAvatar = async (file) => {
    try {
      const user_name = user.name
      const imageKey = `?${Math.random().toString(36).substring(2, 15)}-${Date.now()}`
      const opts = {
        headers: {
          'Content-Type': file.type,
        },
      }
      await axios.put(`/api/users/${user_name}/avatar`, file, opts)
      toast.success('Profile updated')
      setImageKey(imageKey)
    } catch (error) {
      console.log(error)
      toast.error('Unable to update avatar')
      toast.error(error.details)
    }
  }

  const handleInputChange = (e) => {
    e.preventDefault()
    if (!e.target.files || !e.target.files[0]) return
    onUpdateAvatar(e.target.files[0])
  }

  return (
    <Styled.Avatar>
      <input
        type="file"
        ref={fileInput}
        style={{ display: 'none' }}
        multiple={false}
        onChange={handleInputChange}
        accept=".png, .jpeg, .jpg"
      />
      <Styled.ImageIcon>
        <Styled.AvatarIcon onClick={() => fileInput.current.click()} icon="edit" />
        <UserImage size={100} name={user.name} imageKey={imageKey} />
      </Styled.ImageIcon>
    </Styled.Avatar>
  )
}

export default Avatar
