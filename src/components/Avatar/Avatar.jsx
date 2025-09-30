import { useRef, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import UserImage from '@shared/components/UserImage'
import * as Styled from './Avatar.styled'
import MenuContainer from '@components/Menu/MenuComponents/MenuContainer'
import Menu from '@components/Menu/MenuComponents/Menu'
import { useMenuContext } from '@shared/context/MenuContext'
import { useDeleteAvatarMutation } from '@shared/api'

const Avatar = ({ user }) => {
  const fileInput = useRef(null)
  const [imageKey, setImageKey] = useState(null)
  const { setMenuOpen } = useMenuContext()
  const editButtonRef = useRef(null)
  const [deleteAvatar, { isLoading: isDeleting }] = useDeleteAvatarMutation()

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

  const handleDeleteAvatar = async () => {
    try {
      await deleteAvatar({ userName: user.name }).unwrap()
      toast.success('Avatar removed')
      setImageKey(`?${Date.now()}`)
    } catch (error) {
      console.log(error)
      toast.error('Unable to remove avatar')
    }
  }

  const handleEditClick = () => {
    setMenuOpen('avatar-menu')
  }

  const menuItems = [
    {
      id: 'edit',
      label: 'Upload photo...',
      icon: 'edit',
      onClick: () => fileInput.current.click(),
    },
    {
      id: 'delete',
      label: 'Reset to default',
      icon: 'delete',
      onClick: handleDeleteAvatar,
      disabled: isDeleting,
    },
  ]

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
        <Styled.AvatarIcon
          ref={editButtonRef}
          onClick={handleEditClick}
          icon="edit"
        />
        <UserImage size={100} name={user.name} imageKey={imageKey} />
      </Styled.ImageIcon>
      <MenuContainer id="avatar-menu" target={editButtonRef.current}>
        <Menu menu={menuItems} />
      </MenuContainer>
    </Styled.Avatar>
  )
}

export default Avatar
