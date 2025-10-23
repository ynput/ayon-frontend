import React from 'react'
import axios, { AxiosError, AxiosResponse } from 'axios'
import ReactDOM from 'react-dom/client'
import store, { useAppDispatch, useAppSelector } from '@state/store'
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
import { SocketProvider } from '@shared/context'

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

// wrap socket provider so we can pass the correct props
const SocketProviderWrapper = (props: { children: React.ReactNode }) => {
  const dispatch = useAppDispatch()
  const projectName = useAppSelector((state) => state.project.name) as unknown as string
  const userName = useAppSelector((state) => state.user.name)
  return (
    <SocketProvider userName={userName} projectName={projectName} dispatch={dispatch}>
      {props.children}
    </SocketProvider>
  )
}

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
      <SocketProviderWrapper>
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
      </SocketProviderWrapper>
    </ReduxProvider>
  </React.StrictMode>,
)
