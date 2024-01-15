import React, { createContext, useContext } from 'react'
import { useRestartServerMutation } from '../services/restartServer'
import RestartBanner from '../components/RestartBanner/RestartBanner'
import { confirmDialog } from 'primereact/confirmdialog'
import ServerRestartingPage from '../components/ServerRestartingPage'
import useLocalStorage from '../hooks/useLocalStorage'

const RestartContext = createContext()

function RestartProvider(props) {
  const [restartConfig, setRestartConfig] = useLocalStorage('restart', null)
  const [restartServer] = useRestartServerMutation()

  // ask if the user wants to restart the server after saving
  const confirmRestart = ({ middleware } = {}) =>
    confirmDialog({
      // message,
      header: 'Restart Server?',
      // icon: 'pi pi-exclamation-triangle',
      contentStyle: { display: 'none' },
      accept: () => {
        if (middleware) middleware()
        setRestartConfig(null)
        restartServer()
      },
      reject: () => {},
    })

  const restartRequired = ({ message, middleware } = {}) => {
    setRestartConfig({
      message,
      middleware,
    })
  }

  const handleRestart = () => {
    confirmRestart(restartConfig)
  }

  return (
    <RestartContext.Provider
      value={{ restartRequired, confirmRestart, restartConfig, setRestartConfig }}
    >
      {props.children}
      {restartConfig && (
        <RestartBanner message={restartConfig?.message} onRestart={handleRestart} />
      )}
      <ServerRestartingPage />
    </RestartContext.Provider>
  )
}

const useRestart = () => useContext(RestartContext)

export { RestartProvider, useRestart }
