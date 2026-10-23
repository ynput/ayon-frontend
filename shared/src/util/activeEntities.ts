// A tiny registry of the entities the user is currently working with.
//
// There is no single global selection in the app: every page keeps its own
// (table rows, details panel, slide-out...). Features that act on "whatever is
// selected", like the entity links dialog (G), read it from here. Pages and
// panels register what they show and clear it when they unmount.

import { useEffect, useId, useSyncExternalStore } from 'react'

export type ActiveEntity = {
  id: string
  entityType: string
  projectName: string
}

type Registration = {
  entities: ActiveEntity[]
  priority: number
  updatedAt: number
}

// higher priority wins, e.g. a slide-out panel over the page it covers
export const ACTIVE_ENTITIES_PRIORITY = {
  page: 0,
  detailsPanel: 1,
  slideOut: 2,
} as const

const registrations = new Map<string, Registration>()
const listeners = new Set<() => void>()
let snapshot: ActiveEntity[] = []
let clock = 0

const recompute = () => {
  let best: Registration | undefined
  for (const reg of registrations.values()) {
    if (!reg.entities.length) continue
    if (
      !best ||
      reg.priority > best.priority ||
      (reg.priority === best.priority && reg.updatedAt > best.updatedAt)
    ) {
      best = reg
    }
  }
  snapshot = best?.entities ?? []
  listeners.forEach((l) => l())
}

const sameEntities = (a: ActiveEntity[], b: ActiveEntity[]) =>
  a.length === b.length &&
  a.every(
    (e, i) =>
      e.id === b[i].id && e.entityType === b[i].entityType && e.projectName === b[i].projectName,
  )

export const setActiveEntities = (key: string, entities: ActiveEntity[], priority = 0) => {
  const prev = registrations.get(key)
  if (prev && prev.priority === priority && sameEntities(prev.entities, entities)) return
  registrations.set(key, { entities, priority, updatedAt: ++clock })
  recompute()
}

export const clearActiveEntities = (key: string) => {
  if (registrations.delete(key)) recompute()
}

export const getActiveEntities = (): ActiveEntity[] => snapshot

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const useActiveEntities = (): ActiveEntity[] =>
  useSyncExternalStore(subscribe, getActiveEntities)

/** Register entities for as long as the calling component is mounted. */
export const useRegisterActiveEntities = (
  entities: ActiveEntity[] | undefined,
  priority: number = ACTIVE_ENTITIES_PRIORITY.page,
) => {
  const key = useId()
  // stable dependency for arrays that are rebuilt on every render
  const signature = (entities || [])
    .map((e) => `${e.projectName}/${e.entityType}/${e.id}`)
    .join(',')

  useEffect(() => {
    setActiveEntities(key, entities || [], priority)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, signature, priority])

  useEffect(() => () => clearActiveEntities(key), [key])
}
