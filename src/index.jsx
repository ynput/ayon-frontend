import React from 'react'
import { createRoot } from 'react-dom/client'

import { configureStore } from '@reduxjs/toolkit'
import { Provider as ReduxProvider } from 'react-redux'
import { ToastContainer, Flip } from 'react-toastify'

import userReducer from './features/user'
import settingsReducer from './features/settings'
import contextReducer from './features/context'

import App from './app'

import 'react-toastify/dist/ReactToastify.css'
import 'primereact/resources/themes/arya-blue/theme.css'
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'
import './styles/index.sass'

const store = configureStore({
  reducer: {
    user: userReducer,
    settings: settingsReducer,
    context: contextReducer,
  },
})

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
          newestOnTop={true}
          draggable={false}
          closeOnClick={true}
          autoClose={2000}
          limit={5}
        />
      </ReduxProvider>
    </React.StrictMode>
  )
})
