import React from 'react'
import axios from 'axios'
import { createRoot } from 'react-dom/client'

import { configureStore } from '@reduxjs/toolkit'
import { Provider as ReduxProvider } from 'react-redux'
import { ToastContainer, Flip } from 'react-toastify'

import userReducer from './features/user'
import contextReducer from './features/context'
import projectReducer from './features/project'
import editorReducer from './features/editor'
import dashboardReducer from './features/dashboard'

import App from './app'

import 'react-toastify/dist/ReactToastify.css'
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'
import '@ynput/ayon-react-components/dist/style.css'

import './styles/index.scss'
import { ayonApi } from './services/ayon'
import { setupListeners } from '@reduxjs/toolkit/dist/query'
import short from 'short-uuid'
import { SocketProvider } from './context/websocketContext'
import localStorageMiddleware from './features/middleware/localStorageMiddleware'

// generate unique session id
window.senderId = short.generate()

const localStorageItems = {
  'dashboard/onProjectSelected': 'dashboard-selectedProjects',
  'dashboard/onTasksSortByChanged': 'dashboard-tasks-sortBy',
  'dashboard/onTasksGroupByChanged': 'dashboard-tasks-groupBy',
  'dashboard/onTasksFilterChanged': 'dashboard-tasks-filter',
  'dashboard/onTaskSelected': 'dashboard-tasks-selected',
  'dashboard/onAssigneesChanged': 'dashboard-tasks-assignees',
  'dashboard/onAttributesOpenChanged': 'dashboard-tasks-attributesOpen',
}

const store = configureStore({
  reducer: {
    user: userReducer,
    context: contextReducer,
    project: projectReducer,
    editor: editorReducer,
    dashboard: dashboardReducer,
    [ayonApi.reducerPath]: ayonApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(ayonApi.middleware)
      .concat(localStorageMiddleware(localStorageItems)),
})

setupListeners(store.dispatch)

axios.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response.status === 401 && window.location.pathname !== '/') {
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
