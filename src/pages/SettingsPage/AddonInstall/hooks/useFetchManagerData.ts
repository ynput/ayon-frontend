import { useListDependencyPackagesQuery } from '@queries/dependencyPackages/getDependencyPackages'
import { useListInstallersQuery } from '@queries/installers/getInstallers'

const useFetchManagerData = () => {
  const { data: installers  = {}} = useListInstallersQuery({})
  const { data: packages  = {}} = useListDependencyPackagesQuery()


  return { installers, packages }
}

export default useFetchManagerData
