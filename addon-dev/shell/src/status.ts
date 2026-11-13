// What the stage reports: the context each slot of the place passes (Context shows them, per
// slot) and whether it is ready; and window.__AYON_ADDON_SHELL__, what `ayon-addon open | preview`
// reads from the page.
import { useEffect } from 'react'
import { runContribution } from '@ynput/ayon-addon'
import type { AnyContribution } from '@ynput/ayon-addon'
import { getRegistry } from '@ynput/ayon-addon/host'
import { getRecorded, getUnmatched, getUsed } from './network'
import type { PieceEvent } from './tracking'
import type { Fixture, PieceStatus, ShellSelection, ShellStatus } from './types'

declare global {
  interface Window {
    __AYON_ADDON_SHELL__?: ShellStatus
  }
}

type Context = Record<string, unknown>

/** What a slot on stage passes its contributions, and how the stage runs one (a menu, a shortcut). */
export interface SlotReport {
  context: Context
  /** a menu item, shortcut or column menu item of the slot, as the stage runs it; else runContribution */
  run?: (contribution: AnyContribution) => Promise<void> | void
}

let current: { selection: ShellSelection; mode: 'live' | 'preview' } = {
  selection: { entities: [] },
  mode: 'live',
}
// per slot, one report per place on stage that renders it (a scene's card badge: one per card)
let reports: ReadonlyMap<string, readonly SlotReport[]> = new Map()
// the last menu of a slot that opened (useSlotMenuItems in a scene): kept until the place changes
const menus = new Map<string, SlotReport>()
let stageReady = false
let user: Fixture['user']
let pieces: PieceStatus = { found: false, tracked: [], mounted: {}, everMounted: [], runs: 0 }

/** The pieces of the selected contribution the shell wrapped (tracking.ts). */
export const setTrackedPieces = (found: boolean, tracked: string[]) => {
  pieces = { ...pieces, found, tracked }
  publish()
}

/** What a wrapped piece reports. */
export const reportPiece = ({ piece, event }: PieceEvent) => {
  if (event === 'run') pieces = { ...pieces, runs: pieces.runs + 1 }
  else {
    const count = (pieces.mounted[piece] || 0) + (event === 'mount' ? 1 : -1)
    pieces = {
      ...pieces,
      mounted: { ...pieces.mounted, [piece]: Math.max(0, count) },
      everMounted: event === 'mount' && !pieces.everMounted.includes(piece) ? [...pieces.everMounted, piece] : pieces.everMounted,
    }
  }
  publish()
}

const jsonSafe = (value: Context) =>
  JSON.parse(
    JSON.stringify(value, (_key, item) =>
      typeof item === 'function' || item instanceof Element ? undefined : item,
    ),
  ) as Context

const listeners = new Set<() => void>()
/** Context shows what the slots got. */
export const subscribeReports = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
/** A new map after every change (useSyncExternalStore). */
export const getReports = () => reports

const rebuild = (mounted: Map<string, SlotReport[]>) => {
  for (const [slot, menu] of menus) if (!mounted.has(slot)) mounted.set(slot, [menu])
  reports = mounted
  publish()
  listeners.forEach((listener) => listener())
}

// the reports of the mounted reporters, without the menus'
const mountedReports = new Map<string, SlotReport[]>()

/** A slot's report while its place on stage is rendered: removes it again. */
export const reportSlot = (slot: string, report: SlotReport) => {
  mountedReports.set(slot, [...(mountedReports.get(slot) || []), report])
  rebuild(new Map(mountedReports))
  return () => {
    const left = (mountedReports.get(slot) || []).filter((r) => r !== report)
    if (left.length) mountedReports.set(slot, left)
    else mountedReports.delete(slot)
    rebuild(new Map(mountedReports))
  }
}

/** Reports the context a slot passes, while the component is mounted and as it changes. */
export const useSlotReport = (
  slot: string,
  // slot contexts are interfaces (no index signature); this only reads them
  context: object | undefined,
  run?: SlotReport['run'],
) => {
  useEffect(() => {
    if (!context) return undefined
    return reportSlot(slot, { context: context as Context, run })
  }, [slot, context, run])
}

/** A menu of a slot that opened, with the context its items get. */
export const reportMenu = (slot: string, context: Context) => {
  menus.set(slot, { context })
  rebuild(new Map(mountedReports))
}

/** Another place: the menus opened in the last one are gone. */
export const clearMenus = () => {
  if (!menus.size) return
  menus.clear()
  rebuild(new Map(mountedReports))
}

/** The first report of a slot: what Context shows and a fixture is made of. */
export const slotReport = (slot: string) => reports.get(slot)?.[0]

/** A preview fixture of a contribution: its slot's context and the answers recorded since. */
export const fixtureFor = (slot: string, id: string): Fixture | undefined => {
  const report = slotReport(slot)
  if (!report) return undefined
  return { slot: slot as Fixture['slot'], id, context: jsonSafe(report.context), user, responses: getRecorded() }
}

const target = () => {
  const { slot, id } = current.selection
  return slot && id
    ? getRegistry().contributions.find((c) => c.slot === slot && (c as { id?: string }).id === id)
    : undefined
}

function publish() {
  window.__AYON_ADDON_SHELL__ = {
    ready: stageReady && !getRegistry().isLoading,
    mode: current.mode,
    selection: current.selection,
    unmatched: getUnmatched(),
    get used() {
      return getUsed()
    },
    fixture: () => {
      const { slot, id } = current.selection
      return slot && id ? fixtureFor(slot, id) : undefined
    },
    run: async () => {
      const contribution = target()
      const report = contribution && slotReport(contribution.slot)
      if (!contribution || !report) throw new Error('the selected contribution is not on stage')
      if (report.run) await report.run(contribution)
      else if ((contribution as { run?: unknown }).run) await runContribution(contribution as never, report.context as never)
      else throw new Error('the selected contribution has no run piece')
    },
    pieces,
  }
}

export const setStatus = (next: Partial<typeof current>) => {
  current = { ...current, ...next }
  publish()
}

/** Whether the place on stage has rendered what it needs (the status page waits for it). */
export const setStageReady = (ready: boolean) => {
  stageReady = ready
  publish()
}

export const useStageReady = (ready: boolean) => {
  useEffect(() => setStageReady(ready), [ready])
}

export const setShellUser = (next: Fixture['user']) => {
  user = next
  publish()
}
