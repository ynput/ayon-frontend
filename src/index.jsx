import React from 'react'
import axios from 'axios'
import { createRoot } from 'react-dom/client'
import { configureStore } from '@reduxjs/toolkit'
import { Provider as ReduxProvider } from 'react-redux'
import { ToastContainer, Flip } from 'react-toastify'

import userReducer from './features/user'
import contextReducer, { contextLocalItems } from './features/context'
import projectReducer from './features/project'
import editorReducer from './features/editor'
import dashboardReducer, { dashboardLocalItems } from './features/dashboard'
import detailsReducer, { detailsLocalItems } from './features/details'
import addonsManagerReducer from './features/addonsManager'
import previewReducer from './features/preview'

import App from './app'

import 'react-toastify/dist/ReactToastify.css'
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'
import '@ynput/ayon-react-components/dist/style.css'

import './styles/index.scss'
import { ayonApi, GraphQL, RestAPI } from '@queries/ayon'
import { setupListeners } from '@reduxjs/toolkit/query'
import short from 'short-uuid'
import { SocketProvider } from './context/websocketContext'
import localStorageMiddleware from './features/middleware/localStorageMiddleware'

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
    preview: previewReducer,
    [ayonApi.reducerPath]: ayonApi.reducer,
    [RestAPI.reducerPath]: RestAPI.reducer,
    [GraphQL.reducerPath]: GraphQL.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(ayonApi.middleware)
      .concat(RestAPI.middleware)
      .concat(GraphQL.middleware)
      .concat(
        localStorageMiddleware({
          ...dashboardLocalItems,
          ...contextLocalItems,
          ...detailsLocalItems,
        }),
      ),
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
