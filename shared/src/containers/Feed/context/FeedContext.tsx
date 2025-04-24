import { ProjectUser } from '@shared/api/activities'
import React, { createContext, useContext, useState } from 'react'

export const FEED_NEW_COMMENT = '__new__' as const

export type EditingState = null | typeof FEED_NEW_COMMENT | string

// Add type for the refTooltip
export interface RefTooltip {
  id: string | null
  type: string
  name: string
  label: string
  pos: {
    top: number
    left: number
  }
}

export type FeedContextProps = {
  children: React.ReactNode
  projectName: string
  entityType: string
  entities: any[]
  projectInfo: any
  scope: string
  statePath: string
  filter: string
  userName: string
  userFullName: string
  // query functions
  createEntityActivity: (args: any) => Promise<any>
  updateActivity: (args: any) => Promise<any>
  deleteActivity: (args: any) => Promise<any>
  isUpdatingActivity: boolean
  createReaction: (args: any) => Promise<any>
  deleteReaction: (args: any) => Promise<any>
  // annotations
  annotations: Record<string, any>
  removeAnnotation: (id: string) => void
  exportAnnotationComposite: (id: string) => Promise<Blob | null>
  // editingId state and functions
  editingId: EditingState
  setEditingId: (id: EditingState) => void
  // refTooltip state and functions
  refTooltip: RefTooltip | null
  setRefTooltip: (tooltip: RefTooltip | null) => void
  // activities data props
  activitiesData: any[]
  isLoadingActivities: boolean
  isLoadingNew: boolean
  isLoadingNextPage: boolean
  hasNextPage: boolean
  loadNextPage?: () => Promise<any>
  // mentions data
  mentionSuggestionsData: any
  // tooltip data
  entityTooltipData: any
  isFetchingTooltip: boolean
  // users data
  projectUsersData: ProjectUser[]
  // redux callback actions
  onOpenSlideOut?: (args: any) => void
  onOpenImage?: (args: any) => void
  onGoToFrame?: (frame: number) => void
  onOpenViewer?: (args: any) => void
}

interface FeedContextType extends Omit<FeedContextProps, 'children'> {}

const FeedContext = createContext<FeedContextType | undefined>(undefined)

export const FeedProvider = ({ children, ...props }: FeedContextProps) => {
  return (
    <FeedContext.Provider
      value={{
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
