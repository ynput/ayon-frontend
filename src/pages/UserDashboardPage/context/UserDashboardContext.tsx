// load stuff that is globally used in the User Dashboard (home) page here

import { useLoadModule } from '@shared/hooks'
import React, { ReactNode } from 'react'
import {
  RelatedTasksFallback,
  RelatedTasksFallbackProps,
} from '../UserDashboardTasks/RelatedTasks/RelatedTasksFallback'
import { usePowerpack } from '@shared/context'
import { UserDashboardContext } from './UserDashboardContextInstance'

export interface UserDashboardContextType {
  RelatedTasks: React.FC<RelatedTasksFallbackProps>
}

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
