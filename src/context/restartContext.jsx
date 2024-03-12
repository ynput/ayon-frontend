import React, { createContext, useContext, useState } from 'react'
import {
  useGetRestartQuery,
  usePostRestartMutation,
  useRestartServerMutation,
} from '../services/restartServer'
import RestartBanner from '../components/RestartBanner/RestartBanner'
import { confirmDialog } from 'primereact/confirmdialog'
import ServerRestartingPage from '../components/ServerRestartingPage'
import { useSelector } from 'react-redux'

const RestartContext = createContext()

function RestartProvider(props) {
  const isAdmin = useSelector((state) => state.user.data.isAdmin)
  const [restartServer] = useRestartServerMutation()
  const [postRestart] = usePostRestartMutation()

  const { data: restartData = {} } = useGetRestartQuery({ skip: !isAdmin })

  // a function that runs when the server restarts
  const [callback, setCallback] = useState(null)
  // ask if the user wants to restart the server after saving
  const confirmRestart = () =>
    confirmDialog({
      // message,
      header: 'Restart Server?',
      // icon: 'pi pi-exclamation-triangle',
      contentStyle: { display: 'none' },
      accept: () => {
        if (callback) callback()
        restartServer()
      },
      reject: () => {},
    })

  // tell the server that a restart is required
  const restartRequired = async ({ reason, callback } = {}) => {
    setCallback(callback)
    // tell the server that a restart is required
    await postRestart({ required: true, reason })
  }

  return (
    <RestartContext.Provider value={{ restartRequired, confirmRestart }}>
      {props.children}
      {restartData?.required && isAdmin && (
        <RestartBanner message={restartData?.reason} onRestart={confirmRestart} />
      )}
      <ServerRestartingPage />
    </RestartContext.Provider>
  )
}

const useRestart = () => useContext(RestartContext)

export { RestartProvider, useRestart }
