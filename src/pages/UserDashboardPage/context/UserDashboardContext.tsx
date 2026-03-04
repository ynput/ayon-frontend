// load stuff that is globally used in the User Dashboard (home) page here

import { useLoadModule } from '@shared/hooks'
import React, { createContext, ReactNode } from 'react'
import {
  RelatedTasksFallback,
  RelatedTasksFallbackProps,
} from '../UserDashboardTasks/RelatedTasks/RelatedTasksFallback'
import { usePowerpack } from '@shared/context'

interface UserDashboardContextType {
  RelatedTasks: React.FC<RelatedTasksFallbackProps>
}

export const UserDashboardContext = createContext<UserDashboardContextType | undefined>(undefined)

interface UserDashboardProviderProps {
  children: ReactNode
}

export const UserDashboardProvider: React.FC<UserDashboardProviderProps> = ({ children }) => {
  const { powerLicense } = usePowerpack()

  const [RelatedTasks] = useLoadModule({
    addon: 'powerpack',
    remote: 'views',
    module: 'RelatedTasks',
    fallback: RelatedTasksFallback,
    skip: !powerLicense,
    minVersion: '1.5.0',
  })

  return (
    <UserDashboardContext.Provider value={{ RelatedTasks }}>
      {children}
    </UserDashboardContext.Provider>
  )
}

// hook
export const useUserDashboardContext = (): UserDashboardContextType => {
  const context = React.useContext(UserDashboardContext)
  if (context === undefined) {
    throw new Error('useUserDashboardContext must be used within a UserDashboardProvider')
  }
  return context
}
