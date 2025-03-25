import { useDeleteDependencyPackageMutation } from '@queries/dependencyPackages/updateDependencyPackages'
import { useDeleteInstallerFileMutation } from '@queries/installers/updateInstallers'

const useFileManagerMutations = () => {
  const [deleteInstaller] = useDeleteInstallerFileMutation()
  const [deletePackage] = useDeleteDependencyPackageMutation()

  const deleteInstallers = async (installers: string[]) => {
    await Promise.all(installers.map((installer) => deleteInstaller({ filename: installer })))
  }

  const deletePackages = async (packages: string[]) => {
    await Promise.all(
      packages.map((dependencyPackage) => deletePackage({ filename: dependencyPackage })),
    )
  }

  return { deleteInstallers, deletePackages }
}

export default useFileManagerMutations
