import { useDeleteInstallerFileMutation } from '@queries/installers/updateInstallers'

const useMutation = () => {
  const [deleteInstaller] = useDeleteInstallerFileMutation()


  const deleteInstallers = (installers: string[]) => {
    installers.forEach((installer) => {
      deleteInstaller({ filename: installer })
    })
  }

  return { deleteInstallers }
}

export default useMutation
