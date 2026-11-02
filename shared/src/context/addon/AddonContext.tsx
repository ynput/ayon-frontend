import { FC } from 'react'
import type { RouterTypes } from '@shared/components/RemotePage/RemotePageWrapper'
import { AddonContext } from './AddonContextInstance'

export type RemoteAddonComponent = FC<RemoteAddonProps>
export type RemoteAddon = {
  id: string
  component: RemoteAddonComponent
  path: string
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

export const AddonProvider = ({ children, ...props }: AddonContextProps) => {
  return <AddonContext.Provider value={{ ...props }}>{children}</AddonContext.Provider>
}
