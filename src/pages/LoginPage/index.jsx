import { useDispatch } from 'react-redux'
import { LoginPage as SharedLoginPage } from '@shared/components/LoginPage'
import { login } from '@state/user'
import LoadingPage from '../LoadingPage'

// The login page is in shared (addons' standalone dev shell signs in with it too); the app
// stores the session in its user state.
const LoginPage = (props) => {
  const dispatch = useDispatch()
  return (
    <SharedLoginPage
      {...props}
      onLogin={(result) => dispatch(login(result))}
      loading={<LoadingPage />}
    />
  )
}

export default LoginPage
