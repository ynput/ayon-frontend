import React, { createContext } from 'react'
import type { UserDashboardContextType } from './UserDashboardContext'

export const UserDashboardContext = createContext<UserDashboardContextType | undefined>(undefined)

// hook
export const useUserDashboardContext = (): UserDashboardContextType => {
  const context = React.useContext(UserDashboardContext)
  if (context === undefined) {
    throw new Error('useUserDashboardContext must be used within a UserDashboardProvider')
  }
  return context
}
