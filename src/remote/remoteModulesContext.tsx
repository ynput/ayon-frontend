import { createContext, useContext, ReactNode, useEffect, useState } from 'react'
import { registerRemotes } from '@module-federation/enhanced/runtime'
import { useListFrontendModulesQuery } from '@queries/addons/getAddons'
import { useAppSelector } from '@state/store'
import { FrontendModuleListItem } from '@api/rest/addons'
import { useGetInfoQuery } from '@queries/auth/getAuth'

type Module = {
  remote: string
  addon: string
  version: string
  modules: string[]
}

type RemoteModulesContextType = {
  isLoading: boolean
  modules: FrontendModuleListItem[]
  remotesInitialized: boolean
}

const RemoteModulesContext = createContext<RemoteModulesContextType>({
  isLoading: true,
  modules: [],
  remotesInitialized: false,
})

type Props = {
  children: ReactNode
}

export const RemoteModulesProvider = ({ children }: Props) => {
  const user = useAppSelector((state) => state.user.name)

  // only load if logged in
  const { data: addonRemoteModules = [], isLoading } = useListFrontendModulesQuery(undefined, {
    skip: !user,
  })

  const { data: info = {}, isLoading: isLoadingInfo } = useGetInfoQuery({})

  const [remotesInitialized, setRemotesInitialized] = useState(false)

  useEffect(() => {
    if (isLoading || !addonRemoteModules.length || isLoadingInfo) return

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
        }/remoteEntry.js?server=${info?.releaseInfo?.version}-${info?.releaseInfo?.buildDate}`,
        type: 'module',
      })),
    )

    setRemotesInitialized(true)
  }, [addonRemoteModules, isLoading, isLoadingInfo])

  return (
    <RemoteModulesContext.Provider
      value={{
        isLoading,
        modules: addonRemoteModules,
        remotesInitialized,
      }}
    >
      {children}
    </RemoteModulesContext.Provider>
  )
}

export const useRemoteModules = () => useContext(RemoteModulesContext)
