import axios from 'axios'

import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Button, Spacer } from '@ynput/ayon-react-components'
import { Sidebar } from 'primereact/sidebar'
import { logout } from '/src/features/user'
import { useSelector } from 'react-redux'
import { ayonApi } from '/src/services/ayon'

const UserMenu = ({ visible, onHide }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  // get user from redux store
  const user = useSelector((state) => state.user)
  // check if user is logged in and is manager or admin
  const isUser = user.data.isUser

  const doLogout = () => {
    axios
      .post('/api/auth/logout')
      .then((response) => {
        toast.info(response.data.detail)
        dispatch(logout())
        // reset global state
        dispatch(ayonApi.util.resetApiState())
      })
      .catch(() => {
        toast.error('Unable to log out. Weird.')
      })
  }

  return (
    <Sidebar position="right" visible={visible} onHide={onHide} icons={() => <h3>User menu</h3>}>
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: 4,
          gap: 4,
        }}
      >
        <Button
          onClick={() => {
            navigate('/profile')
          }}
          label={`Profile (${user.name})`}
          icon="manage_accounts"
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
        {!isUser && (
          <>
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
                axios.post('/api/system/restart').finally(() => {
                  onHide()
                })
              }}
              label="Server restart"
              icon="restart_alt"
            />
          </>
        )}
        <Spacer />
        <Button onClick={doLogout} label="Sign Out" icon="logout" />
      </div>
    </Sidebar>
  )
}

export default UserMenu
