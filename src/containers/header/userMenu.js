import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Sidebar } from 'primereact/sidebar'
import { Button } from 'primereact/button'
import axios from 'axios'

import { logout } from '../../features/user'

const UserMenu = ({ visible, onHide }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const doLogout = () => {
    axios
      .post('/api/auth/logout')
      .then((response) => {
        toast.info(response.data.detail)
        dispatch(logout())
      })
      .catch(() => {
        toast.error('Unable to log out. Weird.')
      })
  }

  return (
    <Sidebar
      position="right"
      visible={visible}
      onHide={onHide}
      icons={() => <h3>User menu</h3>}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        <Button
          onClick={() => {
            navigate('/doc/api')
            onHide()
          }}
          label="REST API docs"
          icon="pi pi-book"
        />
        <Button
          onClick={() => {
            navigate('/explorer')
            onHide()
          }}
          label="GraphQL explorer"
          icon="pi pi-sitemap"
        />
        <Button
          onClick={() => {
            navigate('/settings')
            onHide()
          }}
          label="Settings"
          icon="pi pi-cog"
        />
        <Button
          onClick={() => {
            navigate('/profile')
            onHide()
          }}
          label="Profile"
          icon="pi pi-user"
        />
        <Button onClick={doLogout} label="Sign Out" icon="pi pi-sign-out" />
      </div>
    </Sidebar>
  )
}

export default UserMenu
