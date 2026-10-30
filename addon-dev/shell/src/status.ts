// window.__AYON_ADDON_SHELL__: what `ayon-addon open | preview` reads from the page.
import { getRegistry } from '@ynput/ayon-addon/host'
import { getRecorded, getUnmatched, getUsed } from './network'
import type { Fixture, ShellSelection, ShellStatus } from './types'

declare global {
  interface Window {
    __AYON_ADDON_SHELL__?: ShellStatus
  }
}

let current: { selection: ShellSelection; mode: 'live' | 'preview' } = {
  selection: { entities: [] },
  mode: 'live',
}
// set by the stage: the context it passes to the selected contribution, and its menu runner
let stageContext: Record<string, unknown> | undefined
let stageRun: (() => Promise<void>) | undefined
let stageReady = false
let user: Fixture['user']

const jsonSafe = (value: Record<string, unknown>) =>
  JSON.parse(
    JSON.stringify(value, (_key, item) =>
      typeof item === 'function' || item instanceof Element ? undefined : item,
    ),
  ) as Record<string, unknown>

const stageListeners = new Set<() => void>()
/** The developer panel shows the context the stage passes. */
export const subscribeStage = (listener: () => void) => {
  stageListeners.add(listener)
  return () => {
    stageListeners.delete(listener)
  }
}
export const getStageContext = () => stageContext

const publish = () => {
  window.__AYON_ADDON_SHELL__ = {
    ready: stageReady,
    mode: current.mode,
    selection: current.selection,
    unmatched: getUnmatched(),
    get used() {
      return getUsed()
    },
    fixture: () => {
      const { slot, id } = current.selection
      if (!slot || !id || !stageContext) return undefined
      return { slot, id, context: jsonSafe(stageContext), user, responses: getRecorded() }
    },
    run: async () => {
      if (!stageRun) throw new Error('the selected contribution has no run piece')
      await stageRun()
    },
  }
}

export const setStatus = (next: Partial<typeof current>) => {
  current = { ...current, ...next }
  publish()
}

export const setStage = (stage: {
  context?: Record<string, unknown>
  run?: () => Promise<void>
  ready: boolean
}) => {
  stageContext = stage.context
  stageRun = stage.run
  stageReady = stage.ready && !getRegistry().isLoading
  publish()
  stageListeners.forEach((listener) => listener())
}

export const setShellUser = (next: Fixture['user']) => {
  user = next
  publish()
}
