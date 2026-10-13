import axios, { AxiosError, AxiosResponse } from 'axios'
import ReactDOM from 'react-dom/client'
import { init } from '@module-federation/enhanced/runtime'

// Initialize Module Federation runtime
// Use dynamic origin based on current window.location for production deployments
init({
  name: 'host',
  remotes: [],
})
// keep this entry free of components so hot updates never re-run it (see AppRoot.tsx)
import AppRoot from './AppRoot'

// styles
import 'react-toastify/dist/ReactToastify.css'
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'
import '@ynput/ayon-react-components/dist/style.css'
import './styles/loadingShimmer.scss'
import './styles/index.scss'
import 'react-perfect-scrollbar/dist/css/styles.css'

import { v4 as uuid } from 'uuid'

// generate unique session id
declare global {
  interface Window {
    senderId: string
  }
}

window.senderId = uuid()

axios.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  (error: AxiosError) => {
    // Handle cases where response might not exist
    if (
      error.response?.status === 401 &&
      window.location.pathname !== '/' &&
      !window.location.pathname.startsWith('/login')
    ) {
      window.location.href = '/'
    }
    return Promise.reject(error)
  },
)

/**
 * Render Application
 *
 * Rendering the root component of the application inside the element with id 'root'.
 */
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<AppRoot />)
