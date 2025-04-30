import React, { createContext, useContext, useState } from 'react'
import useGetFeedActivitiesData from '../hooks/useGetFeedActivitiesData'

// Queries
import {
  useCreateEntityActivityMutation,
  useDeleteActivityMutation,
  useUpdateActivityMutation,
  useCreateReactionToActivityMutation,
  useDeleteReactionToActivityMutation,
} from '@shared/api'
import { useGetEntityTooltipQuery } from '@shared/api'
import { ActivityUser } from '../helpers/groupMinorActivities'

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
  activityTypes: string[]
  entities: any[]
  projectInfo: any
  scope: string
  statePath: string
  filter: string
  userName: string
  userFullName: string

  // annotations
  annotations: Record<string, any>
  removeAnnotation: (id: string) => void
  exportAnnotationComposite: (id: string) => Promise<Blob | null>
  // editingId state and functions
  editingId: EditingState
  setEditingId: (id: EditingState) => void

  // mentions data
  mentionSuggestionsData: any

  // users data
  projectUsersData: ActivityUser[]
  // redux callback actions
  onOpenSlideOut?: (args: any) => void
  onOpenImage?: (args: any) => void
  onGoToFrame?: (frame: number) => void
  onOpenViewer?: (args: any) => void
}

interface FeedContextType extends Omit<FeedContextProps, 'children'> {
  // activities data props
  activitiesData: any[]
  isLoadingActivities: boolean
  isLoadingNew: boolean
  isLoadingNextPage: boolean
  hasNextPage: boolean
  loadNextPage?: () => Promise<any>
  // refTooltip state and functions
  refTooltip: RefTooltip | null
  setRefTooltip: (tooltip: RefTooltip | null) => void
  // tooltip data
  entityTooltipData: any
  isFetchingTooltip: boolean
  // query functions
  createEntityActivity: (args: any) => Promise<any>
  updateActivity: (args: any) => Promise<any>
  deleteActivity: (args: any) => Promise<any>
  createReaction: (args: any) => Promise<any>
  deleteReaction: (args: any) => Promise<any>
  isUpdatingActivity: boolean
}

const FeedContext = createContext<FeedContextType | undefined>(undefined)

export const FeedProvider = ({ children, ...props }: FeedContextProps) => {
  //   queries
  const [createEntityActivityMutation, { isLoading: isLoadingCreate }] =
    useCreateEntityActivityMutation()
  const [updateActivityMutation, { isLoading: isLoadingUpdate }] = useUpdateActivityMutation()
  const [deleteActivityMutation, { isLoading: isLoadingDelete }] = useDeleteActivityMutation()
  const isUpdatingActivity = isLoadingCreate || isLoadingUpdate || isLoadingDelete

  const createEntityActivity: FeedContextType['createEntityActivity'] = async (args) =>
    await createEntityActivityMutation(args).unwrap()
  const updateActivity: FeedContextType['updateActivity'] = async (args) =>
    await updateActivityMutation(args).unwrap()
  const deleteActivity: FeedContextType['deleteActivity'] = async (args) =>
    await deleteActivityMutation(args).unwrap()

  const [createReactionToActivity] = useCreateReactionToActivityMutation()
  const [deleteReactionToActivity] = useDeleteReactionToActivityMutation()

  const createReaction: FeedContextType['createReaction'] = async (args) =>
    await createReactionToActivity(args).unwrap()
  const deleteReaction: FeedContextType['deleteReaction'] = async (args) =>
    await deleteReactionToActivity(args).unwrap()

  const activitiesDataProps = useGetFeedActivitiesData({
    entities: props.entities,
    filter: props.filter,
    activityTypes: props.activityTypes,
    projectName: props.projectName,
    entityType: props.entityType,
  })

  const [refTooltip, setRefTooltip] = useState<RefTooltip | null>(null)
  const skip = !props.projectName || !refTooltip?.id
  const { data: entityTooltipData, isFetching: isFetchingTooltip } = useGetEntityTooltipQuery(
    { entityType: props.entityType, entityId: refTooltip?.id, projectName: props.projectName },
    { skip: skip },
  )

  return (
    <FeedContext.Provider
      value={{
        ...props,
        ...activitiesDataProps,
        isUpdatingActivity,
        entityTooltipData,
        isFetchingTooltip,
        refTooltip,
        setRefTooltip,
        // Query functions
        createEntityActivity,
        updateActivity,
        deleteActivity,
        createReaction,
        deleteReaction,
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
