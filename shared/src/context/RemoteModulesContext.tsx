import { createContext, useContext, ReactNode, useEffect, useState } from 'react'
import { registerRemotes } from '@module-federation/enhanced/runtime'
import {
  FrontendModuleListItem,
  useListFrontendModulesQuery,
  useGetSiteInfoQuery,
} from '@shared/api'

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
  skip?: boolean
}

export const RemoteModulesProvider = ({ children, skip }: Props) => {
  // only load if logged in
  const { data: addonRemoteModules = [], isLoading } = useListFrontendModulesQuery(undefined, {
    skip,
  })

  const { data: info = {}, isLoading: isLoadingInfo } = useGetSiteInfoQuery(
    { full: true },
    { skip },
  )

  const [remotesInitialized, setRemotesInitialized] = useState(false)

  useEffect(() => {
    if (isLoading || !addonRemoteModules.length || isLoadingInfo || remotesInitialized) return

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
  }, [addonRemoteModules, isLoading, isLoadingInfo, remotesInitialized])

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

export const useRemoteModules = () => {
  const context = useContext(RemoteModulesContext)

  if (context === undefined) {
    throw new Error('useRemoteModules must be used within a RemoteModulesProvider')
  }

  return context
}
