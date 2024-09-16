import React from 'react'
import axios from 'axios'
import { createRoot } from 'react-dom/client'
import store from '@state/store'
import { Provider as ReduxProvider } from 'react-redux'
import { ToastContainer, Flip } from 'react-toastify'

import App from './app'

import 'react-toastify/dist/ReactToastify.css'
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'
import '@ynput/ayon-react-components/dist/style.css'

import './styles/index.scss'
import short from 'short-uuid'
import { SocketProvider } from '@context/websocketContext'

// generate unique session id
window.senderId = short.generate()

axios.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (
      error.response.status === 401 &&
      window.location.pathname !== '/' &&
      !window.location.pathname.startsWith('/login')
    ) {
      window.location.href = '/'
    }
    return Promise.reject(error)
  },
)

document.addEventListener('DOMContentLoaded', () => {
  const root = createRoot(document.getElementById('root'))
  root.render(
    <React.StrictMode>
      <ReduxProvider store={store}>
        <SocketProvider>
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
})
