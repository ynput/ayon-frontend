import { Dispatch, ReactNode, SetStateAction, useEffect, useMemo, useRef, useState } from 'react'
import { createRealtimeBatcher, PubSub } from '@shared/util'
import {
  EntityUpdatesContext,
  getUpdateType,
  matchesProject,
  matchesTopic,
  toggleSyncAll,
} from './EntityUpdatesContextInstance'
import { useViewsState } from '@shared/containers/Views/utils/viewUpdateHelper'

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
