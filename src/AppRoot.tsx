import React from 'react'
import { Provider as ReduxProvider } from 'react-redux'
import { ToastContainer, Flip } from 'react-toastify'
import store, { useAppDispatch, useAppSelector } from '@state/store'
import { SocketProvider } from '@shared/context'
import App from './app'

// Kept out of index.tsx so the entry module defines no components: an entry that React Refresh
// treats as a boundary gets re-run on hot updates, mounting a second root.

// wrap socket provider so we can pass the correct props
const SocketProviderWrapper = (props: { children: React.ReactNode }) => {
  const dispatch = useAppDispatch()
  const projectName = useAppSelector((state) => state.project.openProject) ?? undefined
  const userName = useAppSelector((state) => state.user.name)
  return (
    <SocketProvider userName={userName} projectName={projectName} dispatch={dispatch}>
      {props.children}
    </SocketProvider>
  )
}

/**
 * Root component of the application.
 * Wrapping the App component with ReduxProvider and SocketProvider.
 * Including ToastContainer for toast notifications.
 */
const AppRoot = () => (
  <React.StrictMode>
    <ReduxProvider store={store}>
      <SocketProviderWrapper>
        <div id="root-header" className={import.meta.env.DEV ? 'DEV' : ''} />
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
  </React.StrictMode>
)

export default AppRoot
