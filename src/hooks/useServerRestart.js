import { confirmDialog } from 'primereact/confirmdialog'
import { useRestartServerMutation } from '../services/restartServer'

const useServerRestart = () => {
  const [restartServer] = useRestartServerMutation()

  // ask if the user wants to restart the server after saving
  const confirmRestart = (message = 'Restart Server?') =>
    confirmDialog({
      message,
      header: 'Restart Server',
      icon: 'pi pi-exclamation-triangle',
      accept: () => restartServer(),
      reject: () => {},
    })

  return { confirmRestart }
}

export default useServerRestart
