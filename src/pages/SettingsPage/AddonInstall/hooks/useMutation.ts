import api from '@api'
import { useDeleteInstallerFileMutation } from '@queries/installers/updateInstallers'
import { useDispatch } from 'react-redux'

const useMutation = () => {
  const [deleteInstaller] = useDeleteInstallerFileMutation()
  const dispatch = useDispatch()


  const deleteInstallers = (installers: string[]) => {
    installers.forEach((installer) => {
      deleteInstaller({ filename: installer })
    })

    dispatch(
      //@ts-ignore
      api.util.updateQueryData('listInstallers', {}, (draft) => {
        //@ts-ignore
        draft.installers = draft.installers.filter(installer => !installers.includes(installer.filename))
      }),
    )
  }

  return { deleteInstallers }
}

export default useMutation
