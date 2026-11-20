import { useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import isEqual from 'lodash/isEqual'
import { $Any } from '@types'

// change on every edit, search or click: RJSF doesn't draw a field again for them
const CHANGING_KEYS = [
  'overrides',
  'changedKeys',
  'searchText',
  'filterKeys',
  'currentId',
  'breadcrumbs',
]

type Emitter = {
  subscribe: (listener: () => void) => () => void
  notify: () => void
}

const createEmitter = (): Emitter => {
  const listeners = new Set<() => void>()
  return {
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    notify: () => listeners.forEach((listener) => listener()),
  }
}

/**
 * The form context to hand RJSF. RJSF deep-compares a field's props, form context included,
 * before drawing it again, and the overrides and changed keys are rebuilt on every edit: on a
 * big addon, each edit walked them once per field and drew every field again.
 *
 * So this returns the same object on every render, updated in place, and a new one only when a
 * value that rarely changes does (level, layout, the page's context). A field that draws from a
 * value that changes on every edit, search or click reads it with useFormContextSelector.
 *
 * The object is updated while the editor renders, so the fields RJSF draws in the same pass see
 * the new values. Once the render is on screen, every selector checks its slice.
 */
export const useStableFormContext = (context: Record<string, unknown>) => {
  const [emitter] = useState(createEmitter)
  const stable = useRef<{ values: unknown; context: $Any }>({ values: null, context: null })
  useLayoutEffect(() => emitter.notify())

  // callbacks don't count: RJSF counts all functions as equal
  const values = Object.fromEntries(
    Object.entries(context).filter(
      ([key, value]) => !CHANGING_KEYS.includes(key) && typeof value !== 'function',
    ),
  )
  if (!stable.current.context || !isEqual(stable.current.values, values)) {
    stable.current = { values, context: {} }
  }
  return Object.assign(stable.current.context, context, { formContextEmitter: emitter })
}

const noSubscription = () => () => {}

/**
 * What `select` picks from the form context, such as a field's override or whether it matches
 * the search. The component draws again when that changes, compared by value. Use it for the
 * values that change on every edit, search or click (see useStableFormContext). Event handlers
 * can read the context directly.
 */
export const useFormContextSelector = <T>(formContext: $Any, select: (context: $Any) => T): T => {
  // the slice this render saw, kept while equal so a check finds nothing to draw
  let last: { value: T } | undefined
  const getSnapshot = () => {
    const next = select(formContext ?? {})
    if (last && isEqual(last.value, next)) return last.value
    last = { value: next }
    return next
  }
  return useSyncExternalStore(
    formContext?.formContextEmitter?.subscribe ?? noSubscription,
    getSnapshot,
  )
}

/** `currentId` while it is `id` or a field inside it, else null (it is 0 when nothing is
 * selected): a group that opens for the selection draws again only when it is concerned */
export const pointsInside = (currentId: unknown, id: string) =>
  typeof currentId === 'string' && (currentId === id || currentId.startsWith(`${id}_`))
    ? currentId
    : null
