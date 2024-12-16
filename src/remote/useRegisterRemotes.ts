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
}

const useRegisterRemotes = ({ skip }: Props) => {
  const { data: addonModules = [], isLoading } = useListFrontendModulesQuery(undefined, { skip })

  useEffect(() => {
    if (isLoading || !addonModules.length) return

    // create a flat map of modules to load
    const allModules: Module[] = []

    addonModules.forEach((addon) => {
      const { addonName, addonVersion, modules = {} } = addon

      Object.keys(modules).forEach((remote) => {
        allModules.push({
          remote,
          addon: addonName,
          version: addonVersion,
        })
      })
    })

    console.log('registerAddonRemotes', allModules)
    registerRemotes(
      allModules.map((r) => ({
        name: r.remote,
        alias: r.remote,
        entry: `/addons/${r.addon || r.remote}/${r.version}/frontend/modules/${
          r.remote
        }/remoteEntry.js?date=${new Date().toISOString()}`,
        type: 'module',
      })),
    )
  }, [addonModules, isLoading])
}

export default useRegisterRemotes
