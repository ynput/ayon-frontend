import { useDeleteDependencyPackageMutation } from '@queries/dependencyPackages/updateDependencyPackages'
import { useDeleteInstallerFileMutation } from '@queries/installers/updateInstallers'

const useFileManagerMutations = () => {
  const [deleteInstaller] = useDeleteInstallerFileMutation()
  const [deletePackage] = useDeleteDependencyPackageMutation()


  const deleteInstallers = async (installers: string[]) => {
    for (const installer of installers) {
      await deleteInstaller({ filename: installer })
    }
  }

  const deletePackages = async (packages: string[]) => {
    for (const dependencyPackage of packages) {
      await deletePackage({ filename: dependencyPackage })
    }
  }

  return { deleteInstallers, deletePackages }
}

export default useFileManagerMutations
