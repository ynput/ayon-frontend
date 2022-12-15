import React from 'react'
import axios from 'axios'
import { createRoot } from 'react-dom/client'

import { configureStore } from '@reduxjs/toolkit'
import { Provider as ReduxProvider } from 'react-redux'
import { ToastContainer, Flip } from 'react-toastify'

import userReducer from './features/user'
import contextReducer from './features/context'

import App from './app'

import 'react-toastify/dist/ReactToastify.css'
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'
import '@ynput/ayon-react-components/dist/style.css'

import './styles/index.sass'

const store = configureStore({
  reducer: {
    user: userReducer,
    context: contextReducer,
  },
})

axios.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response.status === 401 && window.location.pathname !== '/') {
      window.location.href = '/'
    }
    return Promise.reject(error)
  }
)

document.addEventListener('DOMContentLoaded', () => {
  const root = createRoot(document.getElementById('root'))
  root.render(
    <React.StrictMode>
      <ReduxProvider store={store}>
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
      </ReduxProvider>
    </React.StrictMode>
  )
})
