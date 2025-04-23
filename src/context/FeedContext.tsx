import { FeedActivity } from '@queries/activities/types'
import React, { createContext, useContext, useState } from 'react'

export const FEED_NEW_COMMENT = '__new__' as const

type EditingState = null | typeof FEED_NEW_COMMENT | string

// Add type for the refTooltip
export interface RefTooltip {
  id: string | null
  type: string
  name: string
  label: string
  pos: Record<string, any>
}

export type FeedContextProps = {
  children: React.ReactNode
  scope: string
  statePath: string
  filter: string
  userName: string
  userFullName: string
  createEntityActivity: (args: any) => Promise<any>
  updateActivity: (args: any) => Promise<any>
  deleteActivity: (args: any) => Promise<any>
  isUpdatingActivity: boolean
  // activities data props
  activitiesData: FeedActivity[]
  isLoadingActivities: boolean
  isLoadingNew: boolean
  isLoadingNextPage: boolean
  loadNextPage?: () => Promise<any>
}

interface FeedContextType extends Omit<FeedContextProps, 'children'> {
  // editingId state and functions
  editingId: EditingState
  setEditingId: (id: EditingState) => void
  // refTooltip state and functions
  refTooltip: RefTooltip | null
  setRefTooltip: (tooltip: RefTooltip | null) => void
}

const FeedContext = createContext<FeedContextType | undefined>(undefined)

export const FeedProvider = ({ children, ...props }: FeedContextProps) => {
  const [editingId, setEditingId] = useState<EditingState>(null)
  // Add refTooltip state
  const [refTooltip, setRefTooltip] = useState<RefTooltip | null>(null)

  return (
    <FeedContext.Provider
      value={{
        editingId,
        setEditingId,
        refTooltip,
        setRefTooltip,
        ...props,
      }}
    >
      {children}
    </FeedContext.Provider>
  )
}

export const useFeedContext = () => {
  const context = useContext(FeedContext)
  if (!context) {
    throw new Error('useFeedContext must be used within a FeedProvider')
  }
  return context
}
