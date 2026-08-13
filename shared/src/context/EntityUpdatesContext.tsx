import {
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createRealtimeBatcher, PubSub } from '@shared/util'
import { EntityUpdatesContext } from './EntityUpdatesContextInstance'
import { useViewsState } from '@shared/containers'

// removes the option to disable auto sync
export const FORCE_AUTO_SYNC = true

export type TopicUpdateType =
  | 'created'
  | 'label_changed'
  | 'renamed'
  | 'type_changed'
  | 'status_changed'
  | 'tags_changed'
  | 'attrib_changed'
  | 'deleted'

// settings for different levels of auto syncing
export type RTUpdateConfig = Record<TopicUpdateType, boolean>

// helper function to turn everything on or off for a given level of auto syncing
const toggleSyncAll = (on: boolean): RTUpdateConfig => ({
  created: on,
  label_changed: on,
  renamed: on,
  type_changed: on,
  status_changed: on,
  tags_changed: on,
  attrib_changed: on,
  deleted: on,
})

export type RTEntityUpdate = {
  id: number
  project?: string
  topic: string
  updateType: TopicUpdateType
  entityId?: string
  message?: any
}

// Util type not used in context but by other logic
export type OnSyncDataCallback = (updates: RTEntityUpdate[] | undefined) => void | Promise<void>

export type EntityUpdatesContextValue = {
  updates: RTEntityUpdate[]
  projectNames: string[]
  acknowledge: (topics: string[], projectNames: string[], throughId: number) => void
  getLatestId: () => number
  autoSyncSettings: RTUpdateConfig
  setAutoSyncSettings: Dispatch<SetStateAction<RTUpdateConfig>>
}

type EntityUpdatesProviderProps = {
  children: ReactNode
  projectNames: string[]
}

const matchesTopic = (topic: string, subscribedTopic: string) =>
  topic === subscribedTopic || topic.startsWith(`${subscribedTopic}.`)

const matchesProject = (project: string | undefined, projectNames: string[]) => {
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

export const EntityUpdatesProvider = ({ children, projectNames }: EntityUpdatesProviderProps) => {
  const nextId = useRef(0)
  const [autoSyncSettings = toggleSyncAll(false), setAutoSyncSettings] = useViewsState<
    { autoSync: RTUpdateConfig },
    'autoSync'
  >('autoSync')
  const [updates, setUpdates] = useState<RTEntityUpdate[]>([])

  useEffect(() => {
    let eventKey = 0
    const batcher = createRealtimeBatcher(
      (
        messages: {
          key: number
          project: string
          topic: string
          updateType: TopicUpdateType
          message: any
        }[],
      ) => {
        const newUpdates = messages.map(({ project, topic, updateType, message }) => ({
          id: ++nextId.current,
          project,
          topic,
          updateType,
          entityId: message.summary?.entityId,
          message,
        }))
        setUpdates((current) => [...current, ...newUpdates])
      },
      ({ key }) => String(key),
      0,
    )
    const token = PubSub.subscribeAll((_topic: string, message: any) => {
      if (!message?.topic || !matchesProject(message.project, projectNames)) return

      const updateType = getUpdateType(message.topic)
      // check the type of update and whether auto syncing is enabled for that type
      // NOTE: when auto syncing is enabled we DO NOT push to updates because it is streamed in automatically
      if (!updateType || autoSyncSettings[updateType] || FORCE_AUTO_SYNC) return

      batcher.add({
        key: ++eventKey,
        project: message.project,
        topic: message.topic,
        updateType,
        message,
      })
    })

    return () => {
      PubSub.unsubscribe(token)
      batcher.clear()
    }
  }, [autoSyncSettings, projectNames])

  const value = useMemo<EntityUpdatesContextValue>(
    () => ({
      updates,
      projectNames,
      acknowledge: (topics, projects, throughId) => {
        setUpdates((current) =>
          current.filter(
            (update) =>
              update.id > throughId ||
              !topics.some((topic) => matchesTopic(update.topic, topic)) ||
              !matchesProject(update.project, projects),
          ),
        )
      },
      getLatestId: () => nextId.current,
      autoSyncSettings: FORCE_AUTO_SYNC ? toggleSyncAll(true) : autoSyncSettings, // force auto sync on always if the flag is set
      setAutoSyncSettings,
    }),
    [autoSyncSettings, projectNames, setAutoSyncSettings, updates],
  )

  return <EntityUpdatesContext.Provider value={value}>{children}</EntityUpdatesContext.Provider>
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
