import { createContext, useContext } from 'react'

export const NotificationsContext = createContext()

export function useNotifications() {
  return useContext(NotificationsContext)
}
