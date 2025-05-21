import { useDispatch } from 'react-redux'
import { onSelectedAddons } from '@state/addonsManager'
import { useNavigate } from 'react-router-dom'

const useUninstall = (name) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const onUninstall = () => {
    // set addons manager selection
    dispatch(onSelectedAddons([name]))
    // redirect to addons manager
    navigate('/settings/addons')
  }

  return { onUninstall }
}

export default useUninstall
