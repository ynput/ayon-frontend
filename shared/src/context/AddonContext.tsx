import { createContext, FC, useContext } from 'react'
import { RouterTypes } from '@shared/components'

export type RemoteAddonComponent = FC<RemoteAddonProps>
export type RemoteAddon = {
  id: string
  component: RemoteAddonComponent
  module: string
  viewType?: string // if the addon is using views
  slicer?: { fields: string[] }
  projectList?: { multiSelect?: boolean; enabled: boolean }
}

export interface RemoteAddonProps {
  router: RouterTypes
  toast: any
}

// types for props passed to the provider
export interface AddonContextProps extends RemoteAddonProps {
  children: React.ReactNode
}

// types returned by context
export interface AddonContextType extends RemoteAddonProps {}

const AddonContext = createContext<AddonContextType | undefined>(undefined)

export const AddonProvider = ({ children, ...props }: AddonContextProps) => {
  return <AddonContext.Provider value={{ ...props }}>{children}</AddonContext.Provider>
}

export const useAddonContext = () => {
  const context = useContext(AddonContext)
  if (!context) {
    throw new Error('useAddonContext must be used within a AddonContext')
  }
  return context
}
