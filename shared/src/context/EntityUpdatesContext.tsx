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
import { PubSub } from '@shared/util'
import { EntityUpdatesContext } from './EntityUpdatesContextInstance'
import { useViewsState } from '@shared/containers'

export type RTUpdateType = 'created' | 'changed' | 'deleted'

// settings for different levels of auto syncing
export type RTUpdateConfig = Record<RTUpdateType, boolean>

// helper function to turn everything on or off for a given level of auto syncing
const toggleSyncAll = (on: boolean): RTUpdateConfig => ({
  created: on,
  changed: on,
  deleted: on,
})

export type RTEntityUpdate = {
  id: number
  project?: string
  topic: string
  updateType: RTUpdateType
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

export const getUpdateType = (topic: string): RTUpdateType | undefined => {
  const event = topic.split('.').pop()
  if (!event) return undefined
  if (event.endsWith('_created')) return 'created'
  if (event.endsWith('_deleted')) return 'deleted'
  if (event.endsWith('_changed')) return 'changed'
  if (event === 'created' || event === 'changed' || event === 'deleted') {
    return event
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
    const token = PubSub.subscribeAll((_topic: string, message: any) => {
      if (!message?.topic || !matchesProject(message.project, projectNames)) return

      const updateType = getUpdateType(message.topic)
      // check the type of update and whether auto syncing is enabled for that type
      // NOTE: when auto syncing is enabled we DO NOT push to updates because it is streamed in automatically
      if (!updateType || autoSyncSettings[updateType]) return

      const update: RTEntityUpdate = {
        id: ++nextId.current,
        project: message.project,
        topic: message.topic,
        updateType,
        entityId: message.summary?.entityId,
        message,
      }
      setUpdates((current) => [...current, update])
    })

    return () => PubSub.unsubscribe(token)
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
      autoSyncSettings,
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
