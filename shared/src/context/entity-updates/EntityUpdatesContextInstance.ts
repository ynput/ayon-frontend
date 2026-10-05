import { createContext, useContext, useEffect, useRef } from 'react'
import type {
  EntityUpdatesContextValue,
  RTEntityUpdate,
  RTUpdateConfig,
  TopicUpdateType,
} from './EntityUpdatesContext'

export const EntityUpdatesContext = createContext<EntityUpdatesContextValue | undefined>(undefined)

// helper function to turn everything on or off for a given level of auto syncing
export const toggleSyncAll = (on: boolean): RTUpdateConfig => ({
  created: on,
  label_changed: on,
  renamed: on,
  type_changed: on,
  status_changed: on,
  tags_changed: on,
  attrib_changed: on,
  deleted: on,
})

export const matchesTopic = (topic: string, subscribedTopic: string) =>
  topic === subscribedTopic || topic.startsWith(`${subscribedTopic}.`)

export const matchesProject = (project: string | undefined, projectNames: string[]) => {
  if (projectNames.length === 0) return true
  return projectNames.includes(project || '')
}

export const getUpdateType = (topic: string): TopicUpdateType | undefined => {
  const event = topic.split('.').pop()
  if (!event) return undefined
  if (
    [
      'created',
      'label_changed',
      'renamed',
      'type_changed',
      'status_changed',
      'tags_changed',
      'attrib_changed',
      'deleted',
    ].includes(event)
  ) {
    return event as TopicUpdateType
  } else {
    return undefined
  }
}

type UseSyncUpdatesParams = {
  projectNames?: string[]
  topics: string[]
  isSyncing?: boolean
  shouldSyncOnUpdate?: (update: RTEntityUpdate) => boolean
}

export const useSyncUpdates = ({
  projectNames: projectNamesOverride,
  topics,
  isSyncing = false,
  shouldSyncOnUpdate,
}: UseSyncUpdatesParams) => {
  const context = useContext(EntityUpdatesContext)
  if (!context) {
    throw new Error('useSyncUpdates must be used within an EntityUpdatesProvider')
  }
  const projectNames = projectNamesOverride || context.projectNames

  const syncStartId = useRef(0)
  const previousIsSyncing = useRef(false)
  const subscribedUpdates = context.updates.filter(
    (update) =>
      matchesProject(update.project, projectNames) &&
      topics.some((topic) => matchesTopic(update.topic, topic)) &&
      (shouldSyncOnUpdate?.(update) ?? true),
  )

  useEffect(() => {
    if (isSyncing && !previousIsSyncing.current) {
      syncStartId.current = context.getLatestId()
    } else if (!isSyncing && previousIsSyncing.current) {
      context.acknowledge(topics, projectNames, syncStartId.current)
    }
    previousIsSyncing.current = isSyncing
  }, [context, isSyncing, projectNames, topics])

  return {
    updates: subscribedUpdates,
    hasUpdates: subscribedUpdates.length > 0,
    updateCount: subscribedUpdates.length,
  }
}

// helper hook to get and set auto sync settings for the current view
export const useAutoSyncSettings = () => {
  const context = useContext(EntityUpdatesContext)
  if (!context) {
    throw new Error('useAutoSyncSettings must be used within an EntityUpdatesProvider')
  }

  const { autoSyncSettings, setAutoSyncSettings } = context

  const updateAutoSyncSettings = (payload: {
    settings?: Partial<RTUpdateConfig>
    global?: boolean
  }) => {
    const { settings, global } = payload
    if (global !== undefined) {
      setAutoSyncSettings(toggleSyncAll(global))
    } else {
      setAutoSyncSettings((prev) => ({ ...prev, ...settings }))
    }
  }

  return [autoSyncSettings, updateAutoSyncSettings] as const
}

export const getAutoSyncForTopic = (
  topic: string,
  autoSyncSettings: RTUpdateConfig | undefined,
): boolean => {
  if (!autoSyncSettings) return false
  const updateType = getUpdateType(topic)
  if (!updateType) return false
  return autoSyncSettings[updateType]
}
