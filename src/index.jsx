import React from 'react'
import axios from 'axios'
import { createRoot } from 'react-dom/client'
import { configureStore } from '@reduxjs/toolkit'
import { Provider as ReduxProvider } from 'react-redux'
import { ToastContainer, Flip } from 'react-toastify'

import userReducer from '@state/user'
import contextReducer, { contextLocalItems } from '@state/context'
import projectReducer from '@state/project'
import editorReducer from '@state/editor'
import dashboardReducer, { dashboardLocalItems } from '@state/dashboard'
import detailsReducer, { detailsLocalItems } from '@state/details'
import addonsManagerReducer from '@state/addonsManager'
import reviewReducer, { reviewSearchParams } from '@state/review'

import App from './app'

import 'react-toastify/dist/ReactToastify.css'
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'
import '@ynput/ayon-react-components/dist/style.css'

import './styles/index.scss'
import { RestAPI } from '@queries/ayon'
import { setupListeners } from '@reduxjs/toolkit/query'
import short from 'short-uuid'
import { SocketProvider } from '@context/websocketContext'
import localStorageMiddleware from '@state/middleware/localStorageMiddleware'
import searchParamsMiddleware from './features/middleware/searchParamsMiddleware'

// generate unique session id
window.senderId = short.generate()

const store = configureStore({
  reducer: {
    user: userReducer,
    context: contextReducer,
    project: projectReducer,
    editor: editorReducer,
    dashboard: dashboardReducer,
    details: detailsReducer,
    addonsManager: addonsManagerReducer,
    review: reviewReducer,
    [RestAPI.reducerPath]: RestAPI.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(RestAPI.middleware)
      .concat(
        localStorageMiddleware({
          ...dashboardLocalItems,
          ...contextLocalItems,
          ...detailsLocalItems,
        }),
      )
      .concat(searchParamsMiddleware({ ...reviewSearchParams })),
})

setupListeners(store.dispatch)

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
