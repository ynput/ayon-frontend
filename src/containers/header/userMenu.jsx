import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Sidebar } from 'primereact/sidebar'
import { Button } from 'primereact/button'
import axios from 'axios'

import { Spacer } from '../../components'
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
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        <Button
          onClick={() => {
            onHide()
            navigate('/doc/api')
          }}
          label="REST API docs"
          icon="pi pi-book"
        />
        <Button
          onClick={() => {
            onHide()
            navigate('/explorer')
          }}
          label="GraphQL explorer"
          icon="pi pi-sitemap"
        />
        <Button
          onClick={() => {
            onHide()
            navigate('/settings')
          }}
          label="Settings"
          icon="pi pi-cog"
        />
        <Button
          onClick={() => {
            onHide()
            navigate('/profile')
          }}
          label="Profile"
          icon="pi pi-user"
        />
        <Spacer />
        <Button onClick={doLogout} label="Sign Out" icon="pi pi-sign-out" />
      </div>
    </Sidebar>
  )
}

export default UserMenu
