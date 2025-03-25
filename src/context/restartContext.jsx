import React, { createContext, useContext, useState } from 'react'
import { useGetRestartQuery, useRestartServerMutation } from '@queries/restartServer'
import RestartBanner from '@components/RestartBanner/RestartBanner'
import { confirmDialog } from 'primereact/confirmdialog'
import ServerRestartingPage from '@components/ServerRestartingPage'
import { useSelector } from 'react-redux'
import useLocalStorage from '@hooks/useLocalStorage'

const RestartContext = createContext()

function RestartProvider(props) {
  const isAdmin = useSelector((state) => state.user.data.isAdmin)
  const [restartServer] = useRestartServerMutation()

  const { data: restartData = {} } = useGetRestartQuery({ skip: !isAdmin })

  const [snooze, setSnooze] = useLocalStorage('restart-snooze', null)
  // sets a local storage item to snooze the banner for the day
  const handleSnooze = () => {
    const tonight = new Date()
    tonight.setHours(20, 0, 0, 0)
    setSnooze(tonight.toISOString())
  }

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
        if (typeof callback === 'function') {
          callback()
        }
        restartServer()
        // remove snooze local storage
        localStorage.removeItem('restart-snooze')
      },
      reject: () => {},
    })

  // tell the server that a restart is required
  const restartRequired = async ({ callback } = {}) => {
    setCallback(callback)
  }

  const isRestartRequired = restartData?.required

  const isSnoozing = snooze && new Date(snooze) > new Date() && isRestartRequired

  return (
    <RestartContext.Provider
      value={{
        restartRequired,
        confirmRestart,
        snoozeRestart: handleSnooze,
        isRestartRequired,
        isSnoozing,
      }}
    >
      {props.children}
      {isRestartRequired && isAdmin && !isSnoozing && (
        <RestartBanner
          message={restartData?.reason}
          onRestart={confirmRestart}
          onSnooze={handleSnooze}
        />
      )}
      <ServerRestartingPage />
    </RestartContext.Provider>
  )
}

const useRestart = () => useContext(RestartContext)

export { RestartProvider, useRestart }
