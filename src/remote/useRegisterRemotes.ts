import { registerRemotes } from '@module-federation/enhanced/runtime'
import { useListFrontendModulesQuery } from '@queries/addons/getAddons'
import { useEffect } from 'react'

type Props = {
  skip?: boolean
}

type Module = {
  remote: string
  addon: string
  version: string
  modules: string[]
}

const useRegisterRemotes = ({ skip }: Props) => {
  const { data: addonRemoteModules = [], isLoading } = useListFrontendModulesQuery(undefined, {
    skip,
  })

  useEffect(() => {
    if (isLoading || !addonRemoteModules.length) return

    // create a flat map of modules to load
    const allRemotes: Module[] = []

    addonRemoteModules.forEach((addon) => {
      const { addonName, addonVersion, modules = {} } = addon

      Object.entries(modules).forEach(([remote, modules]) => {
        allRemotes.push({
          remote,
          addon: addonName,
          version: addonVersion,
          modules,
        })
      })
    })

    console.log('registerAddonRemotes', allRemotes)
    registerRemotes(
      allRemotes.map((r) => ({
        name: r.remote,
        alias: r.remote,
        entry: `/addons/${r.addon || r.remote}/${r.version}/frontend/modules/${
          r.remote
        }/remoteEntry.js?date=${new Date().toISOString()}`,
        type: 'module',
      })),
    )
  }, [addonRemoteModules, isLoading])
}

export default useRegisterRemotes
