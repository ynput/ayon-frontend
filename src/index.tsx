import React from 'react'
import axios, { AxiosError, AxiosResponse } from 'axios'
import ReactDOM from 'react-dom/client'
import store from '@state/store'
import { Provider as ReduxProvider } from 'react-redux'
import { ToastContainer, Flip } from 'react-toastify'

import App from './app'

// styles
import 'react-toastify/dist/ReactToastify.css'
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'
import '@ynput/ayon-react-components/dist/style.css'
import './styles/loadingShimmer.scss'
import './styles/index.scss'

import short from 'short-uuid'
import { SocketProvider } from '@context/websocketContext'

// generate unique session id
declare global {
  interface Window {
    senderId: string
  }
}

window.senderId = short.generate()

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
 * Wrapping the App component with ReduxProvider and SocketProvider.
 * Including ToastContainer for toast notifications.
 */
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ReduxProvider store={store}>
      <SocketProvider>
        <div id="root-header" />
        <App />
        <ToastContainer
          position="bottom-right"
          transition={Flip}
          theme="dark"
          pauseOnFocusLoss={false}
          newestOnTop={false}
          draggable={false}
          closeOnClick={true}
          autoClose={5000}
          limit={5}
        />
      </SocketProvider>
    </ReduxProvider>
  </React.StrictMode>,
)
