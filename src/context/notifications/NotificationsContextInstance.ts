import { createContext, useContext } from 'react'

export type SendNotificationOptions = {
  title: string
  body?: string
  options?: NotificationOptions
  link?: string
}

export type NotificationsContextValue = {
  sendNotification: (options: SendNotificationOptions) => Promise<boolean | undefined>
}

export const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined)

export const useNotifications = (): NotificationsContextValue => useContext(NotificationsContext)!
