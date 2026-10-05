import { createContext, useContext } from 'react'
import type { RemoteModulesContextType } from './RemoteModulesContext'

export const RemoteModulesContext = createContext<RemoteModulesContextType>({
  isLoading: true,
  modules: [],
  remotesInitialized: false,
})

export const useRemoteModules = () => {
  const context = useContext(RemoteModulesContext)

  if (context === undefined) {
    throw new Error('useRemoteModules must be used within a RemoteModulesProvider')
  }

  return context
}
