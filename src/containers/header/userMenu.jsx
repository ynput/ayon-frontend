import axios from 'axios'

import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Button, Spacer } from 'openpype-components'
import { Sidebar } from 'primereact/sidebar'
import { logout } from '/src/features/user'

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
          padding: 4,
          gap: 3,
        }}
      >
        <Button
          onClick={() => {
            navigate('/doc/api')
          }}
          label="REST API docs"
          icon="help"
        />
        <Button
          onClick={() => {
            navigate('/explorer')
          }}
          label="GraphQL explorer"
          icon="account_tree"
        />
        <Button
          onClick={() => {
            navigate('/events')
          }}
          label="Event viewer"
          icon="history"
        />
        <Button
          onClick={() => {
            navigate('/services')
          }}
          label="Services"
          icon="home_repair_service"
        />
        <Button
          onClick={() => {
            navigate('/settings')
          }}
          label="Settings"
          icon="settings"
        />
        <Button
          onClick={() => {
            navigate('/profile')
          }}
          label="Profile"
          icon="manage_accounts"
        />
        <Spacer />
        <Button onClick={doLogout} label="Sign Out" icon="logout" />
      </div>
    </Sidebar>
  )
}

export default UserMenu
