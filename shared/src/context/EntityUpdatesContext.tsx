import { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { PubSub } from '@shared/util'

export type RTEntityUpdate = {
  id: number
  project?: string
  topic: string
  entityId?: string
}

// Util type not used in context but by other logic
export type OnSyncDataCallback = (
  updates: RTEntityUpdate[] | undefined,
) => void | Promise<void>

type EntityUpdatesContextValue = {
  updates: RTEntityUpdate[]
  projectNames: string[]
  acknowledge: (topics: string[], projectNames: string[], throughId: number) => void
  getLatestId: () => number
}

type EntityUpdatesProviderProps = {
  children: ReactNode
  projectNames: string[]
}

const EntityUpdatesContext = createContext<EntityUpdatesContextValue | undefined>(undefined)

const matchesTopic = (topic: string, subscribedTopic: string) =>
  topic === subscribedTopic || topic.startsWith(`${subscribedTopic}.`)

const matchesProject = (project: string | undefined, projectNames: string[]) => {
  if (projectNames.length === 0) return true
  return projectNames.includes(project || '')
}

export const EntityUpdatesProvider = ({ children, projectNames }: EntityUpdatesProviderProps) => {
  const nextId = useRef(0)
  const [updates, setUpdates] = useState<RTEntityUpdate[]>([])

  useEffect(() => {
    const token = PubSub.subscribeAll((_topic: string, message: any) => {
      if (!message?.topic || !matchesProject(message.project, projectNames)) return

      const update: RTEntityUpdate = {
        id: ++nextId.current,
        project: message.project,
        topic: message.topic,
        entityId: message.summary?.entityId,
      }
      setUpdates((current) => [...current, update])
    })

    return () => PubSub.unsubscribe(token)
  }, [projectNames])

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
    }),
    [projectNames, updates],
  )

  return <EntityUpdatesContext.Provider value={value}>{children}</EntityUpdatesContext.Provider>
}

type UseSyncUpdatesParams = {
  projectNames?: string[]
  topics: string[]
  isSyncing?: boolean
}

export const useSyncUpdates = ({
  projectNames: projectNamesOverride,
  topics,
  isSyncing = false,
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
      topics.some((topic) => matchesTopic(update.topic, topic)),
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
